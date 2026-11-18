import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDataDir } from './data.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dist = path.join(root, 'ets2-map/dist');
const cloudDist = path.join(root, 'ets2-map/dist-cloud');
const dataDir = await resolveDataDir();
const version = path.basename(dataDir);
await Promise.all([
  rm(dist, { recursive: true, force: true }),
  rm(cloudDist, { recursive: true, force: true }),
  rm(path.join(root, 'cloud-functions'), { recursive: true, force: true })
]);
await Promise.all([mkdir(dist, { recursive: true }), mkdir(cloudDist, { recursive: true })]);

await cp(path.join(root, 'ets2-map/public'), dist, { recursive: true });
await cp(dataDir, path.join(dist, version), { recursive: true });
await writeFile(path.join(dist, 'map-config.js'), `window.ETS2_MAP_VERSION = ${JSON.stringify(version)};\n`);

await cp(path.join(root, 'ets2-map/public'), cloudDist, { recursive: true });
await cp(path.join(root, 'shared'), path.join(cloudDist, 'shared'), { recursive: true });
await cp(path.join(root, 'deploy/cloudflare/pages'), path.join(cloudDist, 'functions'), { recursive: true });
await cp(path.join(root, 'deploy/edgeone/cloud-functions'), path.join(cloudDist, 'cloud-functions'), { recursive: true });
await cp(path.join(root, 'deploy/edgeone/cloud-functions'), path.join(root, 'cloud-functions'), { recursive: true });
await cp(path.join(root, 'edgeone.json'), path.join(cloudDist, 'edgeone.json'));
await writeFile(path.join(cloudDist, '.assetsignore'), 'functions/\ncloud-functions/\nshared/\nedgeone.json\n');
console.log(`Built complete server site in ets2-map/dist/ with ${version} data only.`);
console.log('Built lightweight EdgeOne/Cloudflare site in ets2-map/dist-cloud/ (map data excluded).');
