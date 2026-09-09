import { createServer, IncomingMessage, ServerResponse } from 'node:http';

const PORT = Number(process.env.SKETCH_GATEWAY_PORT ?? 8787);
const HF_TOKEN = process.env.HF_TOKEN;
const DEFAULT_MODEL = process.env.HF_SKETCH_MODEL ?? 'black-forest-labs/FLUX.1-schnell';
const ALLOWED_MODELS = new Set((process.env.HF_SKETCH_ALLOWED_MODELS ?? [
  'black-forest-labs/FLUX.1-schnell',
  'black-forest-labs/FLUX.1-dev',
  'Qwen/Qwen-Image',
].join(',')).split(',').map((value) => value.trim()).filter(Boolean));
const MAX_BODY_BYTES = 64 * 1024;
const MAX_PROMPT_LENGTH = 2000;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error('Request body too large.');
    chunks.push(buffer);
  }
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JSON body.');
  return parsed as Record<string, unknown>;
}

function chooseModel(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_MODEL;
  const model = value.trim();
  return ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;
}

async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    const origin = process.env.SKETCH_ALLOWED_ORIGIN;
    const headers: Record<string, string> = {
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-max-age': '86400',
    };
    if (origin) headers['access-control-allow-origin'] = origin;
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/v1/sketch/generate') {
    sendJson(res, 404, { error: 'not_found' });
    return;
  }
  if (!HF_TOKEN) {
    sendJson(res, 503, { error: 'gateway_not_configured' });
    return;
  }

  try {
    const body = await readJson(req);
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
      sendJson(res, 400, { error: 'invalid_prompt' });
      return;
    }
    const style = typeof body.style === 'string' ? body.style.trim().slice(0, 300) : 'clean hand-drawn sketch';
    const width = Math.round(clampNumber(body.width, 256, 1536, 1024));
    const height = Math.round(clampNumber(body.height, 256, 1536, 1024));
    const seed = typeof body.seed === 'number' && Number.isInteger(body.seed) ? body.seed : undefined;
    const model = chooseModel(body.model);
    const finalPrompt = `Create a traditional hand-drawn sketch on paper. ${prompt}. Style: ${style}. Clean linework, natural pencil or ink texture, artist-drawn appearance, no text, no watermark.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    try {
      const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${HF_TOKEN}`, 'content-type': 'application/json', accept: 'image/*, application/json' },
        body: JSON.stringify({
          inputs: finalPrompt,
          parameters: { width, height, ...(seed === undefined ? {} : { seed }) },
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const text = await response.text();
        sendJson(res, response.status === 429 ? 429 : 502, { error: 'huggingface_error', detail: text.slice(0, 500) });
        return;
      }
      const contentType = response.headers.get('content-type') ?? 'image/png';
      const bytes = Buffer.from(await response.arrayBuffer());
      sendJson(res, 200, {
        mimeType: contentType,
        dataUrl: `data:${contentType};base64,${bytes.toString('base64')}`,
        model,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    sendJson(res, 400, { error: 'bad_request', detail: error instanceof Error ? error.message : 'Unknown error.' });
  }
}

createServer((req, res) => { void handler(req, res); }).listen(PORT, () => {
  console.log(`Sketch AI gateway listening on ${PORT}`);
});
