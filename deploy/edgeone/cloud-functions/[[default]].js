import { getStore } from '@edgeone/pages-blob';
import { mapCacheControl, mapContentType, mapDataLocation } from '../shared/map-data.js';

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (!['GET', 'HEAD'].includes(context.request.method)) {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const location = mapDataLocation(new URL(context.request.url).pathname);
  if (!location) return new Response('Not found', { status: 404, headers: corsHeaders });
  try {
    const store = getStore({ name: context.env.EDGEONE_BLOB_STORE || 'ets2-map', consistency: 'strong' });
    const body = await store.get(location.key, { type: 'arrayBuffer' });
    if (body === null) return new Response('Not found', { status: 404, headers: corsHeaders });
    return new Response(context.request.method === 'HEAD' ? null : body, {
      headers: {
        ...corsHeaders,
        'Content-Type': mapContentType(location.relative),
        'Cache-Control': mapCacheControl(location.relative),
        'X-Map-Version': location.version
      }
    });
  } catch (error) {
    console.error('Blob read failed', error);
    return new Response('Map storage unavailable', { status: 500, headers: corsHeaders });
  }
}
