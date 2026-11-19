const metadataFiles = new Set([
  'Background.json',
  'Background.png',
  'Cities.json',
  'Countries.json',
  'DlcRegions.json',
  'DlcSectors.json',
  'Overlays.json',
  'TileMapInfo.json'
]);
const mapTypes = '(?:American|TMP|American_Promods|TMP_Promods|Europe|Europe_Promods)';

export function mapDataPath(pathname) {
  let relative;
  try {
    relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  } catch {
    return null;
  }
  if (!relative || relative.includes('\\') || relative.includes('\0')) return null;
  if (relative.split('/').some((part) => !part || part === '.' || part === '..')) return null;
  if (/^(ATS|ETS2)\/map-manifest\.json$/.test(relative)) return relative;
  const metadata = new RegExp(`^(ATS|ETS2)/metadata/${mapTypes}/([^/]+)$`).exec(relative);
  if (metadata && metadataFiles.has(metadata[2])) return relative;
  if (new RegExp(`^(ATS|ETS2)/metadata/${mapTypes}/Overlays/[A-Za-z0-9_.-]+\\.png$`).test(relative)) return relative;
  const match = new RegExp(`^(ATS|ETS2)/${mapTypes}/(\\d{1,2})/(\\d+)/(\\d+)\\.png$`).exec(relative);
  if (!match) return null;
  const z = Number(match[2]);
  const x = Number(match[3]);
  const y = Number(match[4]);
  const dimension = 2 ** z;
  return z <= 12 && x < dimension && y < dimension ? relative : null;
}

export function mapDataLocation(pathname) {
  const versioned = /^\/(\d+\.\d+)(\/.*)$/.exec(pathname);
  if (!versioned) return null;
  const version = versioned[1];
  const relative = mapDataPath(versioned[2]);
  if (!relative) return null;
  return { key: `${version}/${relative}`, relative, version };
}

export function mapDataKey(pathname) {
  return mapDataLocation(pathname)?.key || null;
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
