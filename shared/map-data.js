const metadataFiles = new Set([
  'Background.json',
  'Background.png',
  'Cities.json',
  'Countries.json',
  'DlcRegions.json',
  'DlcSectors.json',
  'Overlays.json',
  'TileMapInfo.json',
  'map-manifest.json'
]);

export function mapDataPath(pathname) {
  let relative;
  try {
    relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  } catch {
    return null;
  }
  if (!relative || relative.includes('\\') || relative.includes('\0')) return null;
  if (relative.split('/').some((part) => !part || part === '.' || part === '..')) return null;
  if (metadataFiles.has(relative) || /^Overlays\/[A-Za-z0-9_.-]+\.png$/.test(relative)) return relative;
  const match = /^(ets|tmp_s1)\/(\d{1,2})\/(\d+)\/(\d+)\.png$/.exec(relative);
  if (!match) return null;
  const z = Number(match[2]);
  const x = Number(match[3]);
  const y = Number(match[4]);
  const dimension = 2 ** z;
  return z <= 12 && x < dimension && y < dimension ? relative : null;
}

export function mapDataLocation(pathname, defaultVersion) {
  const versioned = /^\/(v\d+\.\d+)(\/.*)$/.exec(pathname);
  const version = versioned ? versioned[1] : defaultVersion;
  const relative = mapDataPath(versioned ? versioned[2] : pathname);
  if (!relative || !/^v\d+\.\d+$/.test(version || '')) return null;
  return { key: `${version}/${relative}`, relative, version };
}

export function mapDataKey(pathname, version) {
  return mapDataLocation(pathname, version)?.key || null;
}

export function mapContentType(pathname) {
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

export function mapCacheControl(pathname) {
  return pathname.endsWith('.png') && !pathname.endsWith('/Background.png')
    ? 'public, max-age=86400'
    : 'public, max-age=0, must-revalidate';
}
