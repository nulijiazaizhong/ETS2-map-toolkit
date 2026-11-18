import { mapCacheControl, mapContentType, mapDataLocation } from '../shared/map-data.js';

export async function onRequest(context) {
  if (!['GET', 'HEAD'].includes(context.request.method)) {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const location = mapDataLocation(new URL(context.request.url).pathname, context.env.MAP_VERSION);
  if (!location) return context.next();
  const object = await context.env.MAP_DATA.get(location.key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers({
    'Content-Type': mapContentType(location.relative),
    'Cache-Control': mapCacheControl(location.relative),
    'Access-Control-Allow-Origin': '*',
    'X-Map-Version': location.version,
    ETag: object.httpEtag
  });
  return new Response(context.request.method === 'HEAD' ? null : object.body, { headers });
}
