import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveGameDataDir } from './data.mjs';

const sourceSets = {
  ATS: ['American', 'TMP', 'American_Promods', 'TMP_Promods'],
  ETS2: ['Europe', 'TMP', 'Europe_Promods', 'TMP_Promods']
};

for (const [game, sources] of Object.entries(sourceSets)) {
  let dataDir;
  try {
    dataDir = await resolveGameDataDir(game);
    await stat(dataDir);
  } catch {
    continue;
  }
  const version = path.basename(path.dirname(dataDir));
  const files = [];
  let bytes = 0;
  async function collect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) await collect(filePath);
      else if (entry.isFile() && entry.name !== 'map-manifest.json') {
        const info = await stat(filePath);
        files.push(path.relative(dataDir, filePath).split(path.sep).join('/'));
        bytes += info.size;
      }
    }
  }
  await collect(dataDir);
  const manifest = {
    game,
    gameVersion: version,
    generatedAt: new Date().toISOString(),
    files: files.length,
    bytes,
    sources: sources.filter((source) => files.some((file) => file.startsWith(`${source}/`)))
  };
  await writeFile(path.join(dataDir, 'map-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${game} ${version}: ${manifest.files} files, ${(bytes / 1024 / 1024).toFixed(1)} MiB, ${manifest.sources.length} sources`);
}
