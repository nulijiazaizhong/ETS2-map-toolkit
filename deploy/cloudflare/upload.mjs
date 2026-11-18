import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { AwsClient } from 'aws4fetch';
import { resolveDataDir } from '../../ets2-map/scripts/data.mjs';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
if (!accountId || !accessKeyId || !secretAccessKey) {
  throw new Error('Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY before uploading.');
}
const bucket = process.env.CLOUDFLARE_R2_BUCKET || 'ets2-map';
const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
const dataDir = await resolveDataDir();
const version = path.basename(dataDir);
const client = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto', retries: 4 });
const concurrency = Number(process.env.CLOUDFLARE_UPLOAD_CONCURRENCY || 128);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 256) {
  throw new Error('CLOUDFLARE_UPLOAD_CONCURRENCY must be an integer between 1 and 256.');
}
console.log(`Upload concurrency: ${concurrency}`);
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

function objectUrl(key) {
  return `${endpoint}/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
}
function decodeXml(value) {
  return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
async function listExisting() {
  const keys = new Set();
  let continuation;
  do {
    const url = new URL(`${endpoint}/${bucket}`);
    url.searchParams.set('list-type', '2');
    url.searchParams.set('prefix', `${version}/`);
    if (continuation) url.searchParams.set('continuation-token', continuation);
    const response = await client.fetch(url.toString());
    const text = await response.text();
    if (!response.ok) throw new Error(`R2 list failed: ${response.status} ${text.slice(0, 200)}`);
    for (const match of text.matchAll(/<Key>([\s\S]*?)<\/Key>/g)) keys.add(decodeXml(match[1]));
    continuation = /<IsTruncated>true<\/IsTruncated>/.test(text)
      ? decodeXml(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(text)?.[1] || '')
      : '';
  } while (continuation);
  return keys;
}

const resume = process.argv.includes('--resume');
const existing = resume ? await listExisting() : new Set();
if (resume) console.log(`Resume enabled: found ${existing.size} existing objects for ${version}`);
let cursor = 0;
let completed = 0;
async function uploadWorker() {
  while (cursor < files.length) {
    const filePath = files[cursor++];
    const relative = path.relative(dataDir, filePath).split(path.sep).join('/');
    const key = `${version}/${relative}`;
    if (!existing.has(key)) {
      const body = await readFile(filePath);
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          const response = await client.fetch(objectUrl(key), {
            method: 'PUT',
            body,
            headers: { 'Content-Type': relative.endsWith('.png') ? 'image/png' : 'application/json; charset=utf-8' }
          });
          if (!response.ok) throw new Error(`R2 PUT ${response.status}: ${(await response.text()).slice(0, 200)}`);
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
console.log(`Uploaded map ${version} to Cloudflare R2 bucket ${bucket}.`);
