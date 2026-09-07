export interface Env {
  VOICE_BUCKET: R2Bucket;
  VOICE_RATE_LIMIT: KVNamespace;
}

const WINDOW_SECONDS = 60;
const MAX_DOWNLOADS_PER_WINDOW = 100;

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'anonymous';
  const app = request.headers.get('X-Nexus-App') || 'nexus-plus';
  return `${app}:${forwarded.split(',')[0].trim()}`;
}

function validPath(pathname: string): { voiceId: string; filename: string } | null {
  const match = pathname.match(/^\/voices\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  const voiceId = decodeURIComponent(match[1]);
  const filename = decodeURIComponent(match[2]);
  if ((filename !== `${voiceId}.onnx` && filename !== `${voiceId}.onnx.json`) || !/^[a-z0-9-]+$/.test(voiceId)) return null;
  return { voiceId, filename };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405 });

    const url = new URL(request.url);
    const asset = validPath(url.pathname);
    if (!asset) return json({ error: 'Invalid voice asset path.' }, 404);

    const key = `voice-download:${clientKey(request)}`;
    const current = Number(await env.VOICE_RATE_LIMIT.get(key) || '0');
    if (current >= MAX_DOWNLOADS_PER_WINDOW) {
      return new Response('Voice downloads are temporarily busy. Please try again in a few seconds.', {
        status: 429,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-store',
          'retry-after': String(WINDOW_SECONDS),
        },
      });
    }

    await env.VOICE_RATE_LIMIT.put(key, String(current + 1), { expirationTtl: WINDOW_SECONDS });

    const object = await env.VOICE_BUCKET.get(`${asset.voiceId}/${asset.filename}`);
    if (!object) return new Response('Voice asset not found.', { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    headers.set('x-content-type-options', 'nosniff');
    return new Response(request.method === 'HEAD' ? null : object.body, { headers });
  },
};
