import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
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
let cursor = 0;
let completed = 0;
async function uploadWorker() {
  while (cursor < files.length) {
    const filePath = files[cursor++];
    const relative = path.relative(dataDir, filePath).split(path.sep).join('/');
    const buffer = await readFile(filePath);
    const body = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    await store.set(`${version}/${relative}`, body);
    completed++;
    if (completed % 500 === 0 || completed === files.length) {
      console.log(`Uploaded ${completed}/${files.length} objects for ${version}`);
    }
  }
}
await Promise.all(Array.from({ length: 8 }, uploadWorker));
console.log(`Uploaded map ${version} to EdgeOne Blob store ${process.env.EDGEONE_BLOB_STORE || 'ets2-map'}.`);
