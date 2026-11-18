import { mapCacheControl, mapContentType, mapDataLocation } from '../../shared/map-data.js';

export default {
  async fetch(request, env) {
    const location = mapDataLocation(new URL(request.url).pathname, env.MAP_VERSION);
    if (!location) return env.ASSETS.fetch(request);
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const object = await env.MAP_DATA.get(location.key);
    if (!object) return new Response('Not found', { status: 404 });
    const headers = new Headers({
      'Content-Type': mapContentType(location.relative),
      'Cache-Control': mapCacheControl(location.relative),
      'Access-Control-Allow-Origin': '*',
      'X-Map-Version': location.version,
      ETag: object.httpEtag
    });
    return new Response(request.method === 'HEAD' ? null : object.body, { headers });
  }
};
