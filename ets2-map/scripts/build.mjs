import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dist = path.join(root, 'ets2-map/dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, 'ets2-map/public'), dist, { recursive: true });
await cp(path.join(root, 'shared'), path.join(dist, 'shared'), { recursive: true });
await cp(path.join(root, 'deploy/cloudflare/pages'), path.join(dist, 'functions'), { recursive: true });
await cp(path.join(root, 'deploy/edgeone/cloud-functions'), path.join(dist, 'cloud-functions'), { recursive: true });
await cp(path.join(root, 'edgeone.json'), path.join(dist, 'edgeone.json'));
await rm(path.join(root, 'cloud-functions'), { recursive: true, force: true });
await cp(path.join(root, 'deploy/edgeone/cloud-functions'), path.join(root, 'cloud-functions'), { recursive: true });
await writeFile(path.join(dist, '.assetsignore'), 'functions/\ncloud-functions/\nshared/\nedgeone.json\n');
console.log('Built static UI and platform functions in ets2-map/dist/ (map data excluded).');
