import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapCacheControl, mapContentType, mapDataLocation } from '../../shared/map-data.js';
import { resolveDataDir } from './data.mjs';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const useDist = process.argv.includes('--dist');
const staticRoot = path.join(appRoot, useDist ? 'dist' : 'public');
const dataRoot = await resolveDataDir();
const mapsRoot = useDist ? staticRoot : path.dirname(dataRoot);
const activeVersion = path.basename(dataRoot);
const port = Number(process.env.PORT || 8080);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const dataLocation = mapDataLocation(pathname);
    let filePath;
    if (dataLocation) {
      filePath = path.join(mapsRoot, dataLocation.key);
    } else {
      const decoded = decodeURIComponent(pathname);
      filePath = path.resolve(staticRoot, `.${decoded === '/' ? '/index.html' : decoded}`);
      if (!filePath.startsWith(`${path.resolve(staticRoot)}${path.sep}`)) {
        response.writeHead(403).end();
        return;
      }
    }
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('Not a file');
    const body = request.method === 'HEAD' ? null : await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': dataLocation ? mapContentType(dataLocation.relative) : mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': dataLocation ? mapCacheControl(dataLocation.relative) : 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'X-Map-Version': dataLocation?.version || activeVersion
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
}).listen(port, () => {
  console.log(`ETS2 map: http://localhost:${port}`);
  console.log(`Static files: ${staticRoot}`);
  console.log(`Map data: ${dataRoot}`);
});
