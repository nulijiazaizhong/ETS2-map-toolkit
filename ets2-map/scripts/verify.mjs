import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot, resolveGameDataDir } from './data.mjs';
import { mapDataKey } from '../../shared/map-data.js';

const root = await resolveGameDataDir('ETS2');
const metadataRoot = path.join(root, 'metadata', 'Europe');
const info = JSON.parse(await readFile(path.join(metadataRoot, 'TileMapInfo.json'), 'utf8'));
const cities = JSON.parse(await readFile(path.join(metadataRoot, 'Cities.json'), 'utf8'));
const countries = JSON.parse(await readFile(path.join(metadataRoot, 'Countries.json'), 'utf8'));
const dlcSectors = JSON.parse(await readFile(path.join(metadataRoot, 'DlcSectors.json'), 'utf8'));
const dlcRegions = JSON.parse(await readFile(path.join(metadataRoot, 'DlcRegions.json'), 'utf8'));
const background = JSON.parse(await readFile(path.join(metadataRoot, 'Background.json'), 'utf8'));
assert.equal(dlcSectors.length, 1148);
assert.equal(dlcRegions.length, 12);
const iceland = dlcRegions.find((region) => region.Archive === 'dlc_iceland.scs');
assert.ok(iceland.Polygons[0].length >= 100);
assert.ok(dlcRegions.find((region) => region.Archive === 'dlc_greece.scs').Polygons.length >= 20);
assert.ok(dlcRegions.every((region) => region.Polygons.every((polygon) => polygon.length >= 3)));
assert.ok(background.alignmentScore > 0.9);
assert.equal(background.tileSize, 512);
assert.equal(background.mosaicSize, 2048);
const backgroundPng = await readFile(path.join(metadataRoot, 'Background.png'));
assert.equal(backgroundPng.readUInt32BE(16), 4096);
assert.equal(backgroundPng.readUInt32BE(20), 4096);
assert.equal(info.minZoom, 0);
assert.equal(info.maxZoom, 8);
assert.ok(info.x2 > info.x1 && info.y2 > info.y1);
assert.ok(cities.length >= 380, `Expected at least 380 cities, got ${cities.length}`);
assert.ok(countries.length >= 35);
for (const city of cities) {
  assert.ok(city.Width > 0 && city.Height > 0, `Missing city area: ${city.Name}`);
  assert.ok(Math.abs(city.CenterX - (city.X + city.Width / 2)) < 0.01);
  assert.ok(Math.abs(city.CenterY - (city.Y + city.Height / 2)) < 0.01);
  assert.ok(Number.isFinite(city.NodeX) && Number.isFinite(city.NodeY), `Missing city label anchor: ${city.Name}`);
  assert.equal(city.MapXOffsets.length, 4);
  assert.equal(city.MapYOffsets.length, 4);
}
const reims = cities.find((city) => city.Name === 'Reims');
assert.ok(Math.abs(reims.CenterX - reims.NodeX) < 0.2 && Math.abs(reims.CenterY - reims.NodeY) < 0.2);
const archiveCounts = cities.reduce((counts, city) => {
  counts[city.SourceArchive] = (counts[city.SourceArchive] || 0) + 1;
  return counts;
}, {});
for (const archive of ['base_map.scs', 'dlc_east.scs', 'dlc_north.scs', 'dlc_fr.scs', 'dlc_it.scs', 'dlc_balt.scs', 'dlc_balkan_e.scs', 'dlc_balkan_w.scs', 'dlc_iberia.scs', 'dlc_greece.scs', 'dlc_polar.scs', 'dlc_iceland.scs']) {
  assert.ok(archiveCounts[archive] >= 3, `Missing DLC cities: ${archive}`);
}
assert.equal(archiveCounts['dlc_iceland.scs'], 14);

const normalize = (value) => String(value).toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const names = new Set(cities.flatMap((city) => [city.Name, ...Object.values(city.LocalizedNames || {})]).map(normalize));
const requiredCities = ['Berlin', 'Warszawa', 'Stockholm', 'Paris', 'Roma', 'Tallinn', 'Sofia', 'Madrid', 'Split', 'Athens', 'Tromsø', 'Reykjavík'];
for (const city of requiredCities) assert.ok(names.has(normalize(city)), `Missing map-DLC anchor city: ${city}`);
const locales = new Set(cities.flatMap((city) => Object.keys(city.LocalizedNames || {})));
assert.ok(locales.size >= 40, `Expected at least 40 city-name languages, got ${locales.size}`);
const athens = cities.find((city) => city.LocalizedNames?.en_gb === 'Athens');
for (const [locale, expected] of Object.entries({ zh_cn: '雅典', el_gr: 'Αθήνα', ru_ru: 'Афины', ja_jp: 'アテネ' })) {
  assert.equal(athens.LocalizedNames[locale], expected, `Missing Athens localization for ${locale}`);
}

async function verifyTiles(source) {
  let count = 0;
  for (let z = info.minZoom; z <= info.maxZoom; z++) {
    const dimension = 2 ** z;
    for (let x = 0; x < dimension; x++) {
      const entries = await readdir(path.join(root, source, String(z), String(x)));
      assert.equal(entries.filter((entry) => entry.endsWith('.png')).length, dimension, `Incomplete ${source} tile column ${z}/${x}`);
      count += dimension;
    }
    const png = await readFile(path.join(root, source, String(z), '0', '0.png'));
    assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 512);
    assert.equal(png.readUInt32BE(20), 512);
  }
  return count;
}
const tileCount = await verifyTiles('Europe');
const tmpTileCount = await verifyTiles('TMP');
assert.equal(tileCount, 87381);
assert.equal(tmpTileCount, 87381);
assert.equal(mapDataKey('/1.62/ETS2/TMP/6/12/7.png'), '1.62/ETS2/TMP/6/12/7.png');
assert.equal(mapDataKey('/1.62/ATS/American/6/12/7.png'), '1.62/ATS/American/6/12/7.png');
assert.equal(mapDataKey('/1.62/ETS2/Europe_Promods/6/12/7.png'), '1.62/ETS2/Europe_Promods/6/12/7.png');
assert.equal(mapDataKey('/1.62/ETS2/TMP_Promods/6/12/7.png'), '1.62/ETS2/TMP_Promods/6/12/7.png');
assert.equal(mapDataKey('/1.62/ETS2/metadata/Europe/Cities.json'), '1.62/ETS2/metadata/Europe/Cities.json');
assert.equal(mapDataKey('/tmp_s1/6/12/7.png'), null);
assert.equal(mapDataKey('/v1.62/ets/6/12/7.png'), null);
assert.equal(mapDataKey('/1.62/ETS2/TMP/6/64/7.png'), null);
assert.equal(mapDataKey('/data/maps/active.json'), null);
for (const file of ['index.html', 'app.css', 'app.js', 'sw.js', 'map-config.js', 'vendor/leaflet.js', 'vendor/leaflet.css', 'vendor/geist-latin.woff2', 'vendor/GEIST-LICENSE.txt', 'vendor/icons/ets2.png', 'vendor/icons/ats.png']) {
  assert.ok((await readFile(path.join(projectRoot, 'ets2-map/public', file))).length > 0, `Missing ${file}`);
}
console.log(`Verified ${tileCount} ETS2 tiles and ${tmpTileCount} TruckersMP tiles, ${cities.length} cities in ${locales.size} languages, ${dlcSectors.length} DLC sectors, and official background alignment ${(background.alignmentScore * 100).toFixed(1)}%.`);
