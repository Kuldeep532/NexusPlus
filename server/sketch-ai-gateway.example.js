// Reference Worker shape for the Sketch Generator AI gateway.
// Deploy as a Cloudflare Worker and store HF_TOKEN with `wrangler secret put HF_TOKEN`.
// Do not expose HF_TOKEN to the mobile application.

const ALLOWED_ORIGINS = new Set(['https://nexusplus.app']);
const MAX_PROMPT_LENGTH = 1000;
const HF_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';

function cors(origin) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://nexusplus.app';
  return {
    'access-control-allow-origin': allowed,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    vary: 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/v1/sketch/generate') return new Response('Not found', { status: 404 });
    if (!env.HF_TOKEN) return new Response('AI gateway is not configured.', { status: 503, headers: cors(origin) });

    let body;
    try { body = await request.json(); } catch { return new Response('Invalid JSON.', { status: 400, headers: cors(origin) }); }
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt || prompt.length > MAX_PROMPT_LENGTH) return new Response('Prompt is required and must be under 1000 characters.', { status: 400, headers: cors(origin) });

    const width = Number.isInteger(body?.width) ? Math.min(Math.max(body.width, 256), 1536) : 1024;
    const height = Number.isInteger(body?.height) ? Math.min(Math.max(body.height, 256), 1536) : 1024;
    const style = typeof body?.style === 'string' ? body.style.slice(0, 200) : 'pencil sketch';
    const enhancedPrompt = `${prompt}, ${style}, clean sketch, monochrome line art, high contrast, plain background`;

    const hfResponse = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.HF_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ inputs: enhancedPrompt, parameters: { width, height } }),
    });
    if (!hfResponse.ok) return new Response(JSON.stringify({ error: 'Upstream model request failed.' }), { status: 502, headers: { 'content-type': 'application/json', ...cors(origin) } });

    const bytes = await hfResponse.arrayBuffer();
    return new Response(bytes, { status: 200, headers: { 'content-type': hfResponse.headers.get('content-type') || 'image/png', ...cors(origin), 'cache-control': 'no-store' } });
  },
};
