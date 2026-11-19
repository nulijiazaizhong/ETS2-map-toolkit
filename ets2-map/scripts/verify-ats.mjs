import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Usage: node scripts/verify-ats.mjs <ats-version-data-dir>');
const sources = ['American', 'TMP', 'American_Promods', 'TMP_Promods'];
const hashes = new Map();

for (const source of sources) {
  const info = JSON.parse(await readFile(path.join(root, 'metadata', source, 'TileMapInfo.json'), 'utf8'));
  const cities = JSON.parse(await readFile(path.join(root, 'metadata', source, 'Cities.json'), 'utf8'));
  const countries = JSON.parse(await readFile(path.join(root, 'metadata', source, 'Countries.json'), 'utf8'));
  const locales = new Set(cities.flatMap((city) => Object.keys(city.LocalizedNames || {})));
  assert.equal(info.minZoom, 0);
  assert.equal(info.maxZoom, 8);
  assert.ok(info.x2 > info.x1 && info.y2 > info.y1);
  assert.ok(cities.length >= 289, `${source}: too few cities`);
  assert.ok(countries.length >= 21, `${source}: too few countries`);
  assert.ok(locales.size >= 40, `${source}: too few languages`);
  if (source === 'American_Promods' || source === 'TMP_Promods') {
    assert.ok(cities.length >= 327, `${source}: ProMods cities missing`);
  }
  let count = 0;
  for (let z = info.minZoom; z <= info.maxZoom; z++) {
    const dimension = 2 ** z;
    for (let x = 0; x < dimension; x++) {
      const entries = await readdir(path.join(root, source, String(z), String(x)));
      assert.equal(entries.filter((entry) => entry.endsWith('.png')).length, dimension, `${source}: incomplete tile column ${z}/${x}`);
      count += dimension;
    }
    const png = await readFile(path.join(root, source, String(z), '0', '0.png'));
    assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 512);
    assert.equal(png.readUInt32BE(20), 512);
  }
  assert.equal(count, 87381, `${source}: wrong tile count`);
  hashes.set(source, createHash('sha256').update(await readFile(path.join(root, source, '0', '0', '0.png'))).digest('hex'));
  console.log(`${source}: ${count} tiles, ${cities.length} cities, ${countries.length} countries, ${locales.size} languages`);
}
assert.notEqual(hashes.get('American'), hashes.get('American_Promods'), 'ProMods did not change the rendered map');
console.log(`Verified all four ATS map variants in ${root}`);
