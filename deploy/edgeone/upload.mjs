import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { getStore } from '@edgeone/pages-blob';
import { resolveDataDir } from '../../ets2-map/scripts/data.mjs';

const projectId = process.env.EDGEONE_PROJECT_ID;
const token = process.env.EDGEONE_API_TOKEN;
if (!projectId || !token) {
  throw new Error('Set EDGEONE_PROJECT_ID and EDGEONE_API_TOKEN before uploading.');
}
const dataDir = await resolveDataDir();
const version = path.basename(dataDir);
const files = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(filePath);
    else if (entry.isFile()) files.push(filePath);
  }
}
await collect(dataDir);
if (!files.length) throw new Error(`No map data found in ${dataDir}`);

const store = getStore({ name: process.env.EDGEONE_BLOB_STORE || 'ets2-map', projectId, token, consistency: 'strong' });
const concurrency = Number(process.env.EDGEONE_UPLOAD_CONCURRENCY || 32);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 64) {
  throw new Error('EDGEONE_UPLOAD_CONCURRENCY must be an integer between 1 and 64.');
}
const resume = process.argv.includes('--resume');
console.log(`Upload concurrency: ${concurrency}`);
const existing = new Set();
if (resume) {
  try {
    const { blobs } = await store.list({ prefix: `${version}/` });
    for (const blob of blobs) existing.add(blob.key);
    console.log(`Resume enabled: found ${existing.size} existing objects for ${version}`);
  } catch (error) {
    if (error.statusCode !== 403) throw error;
    console.warn(`Blob LIST is denied; uploading all objects instead. ${error.message}`);
  }
}
let cursor = 0;
let completed = 0;
async function uploadWorker() {
  while (cursor < files.length) {
    const filePath = files[cursor++];
    const relative = path.relative(dataDir, filePath).split(path.sep).join('/');
    const key = `${version}/${relative}`;
    if (!existing.has(key)) {
      const buffer = await readFile(filePath);
      const body = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          await store.set(key, body);
          break;
        } catch (error) {
          if (attempt === 4) throw error;
          console.warn(`Retry ${attempt}/3 for ${key}: ${error.message}`);
          await sleep(2 ** attempt * 1000);
        }
      }
    }
    completed++;
    if (completed % 500 === 0 || completed === files.length) {
      console.log(`Progress ${completed}/${files.length} objects for ${version}`);
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, uploadWorker));
console.log(`Uploaded map ${version} to EdgeOne Blob store ${process.env.EDGEONE_BLOB_STORE || 'ets2-map'}.`);
