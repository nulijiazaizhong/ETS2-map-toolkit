import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export async function resolveDataDir() {
  const active = JSON.parse(await readFile(path.join(projectRoot, 'data/maps/active.json'), 'utf8'));
  const version = process.env.MAP_VERSION || active.version;
  if (!/^\d+\.\d+$/.test(version || '')) {
    throw new Error(`Invalid map version: ${version}`);
  }
  return path.join(projectRoot, 'data/maps', version);
}

export async function resolveGameDataDir(game) {
  if (!['ATS', 'ETS2'].includes(game)) throw new Error(`Invalid game: ${game}`);
  return path.join(await resolveDataDir(), game);
}
