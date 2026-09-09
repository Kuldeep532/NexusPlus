import { createServer, IncomingMessage, ServerResponse } from 'node:http';

const PORT = Number(process.env.SKETCH_GATEWAY_PORT ?? 8787);
const MAX_BODY_BYTES = 64 * 1024;
const MAX_TEXT_LENGTH = 4000;

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

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&apos;');
}

function stableSeed(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function tokenize(text: string): string[] {
  return text.normalize('NFKC').trim().split(/\s+/u).filter(Boolean).slice(0, 90);
}

/**
 * Lightweight deterministic text-to-sketch renderer.
 * It intentionally runs without an AI model, local weights, or Hugging Face calls,
 * so low-RAM devices only perform normal SVG rendering on the phone.
 */
function textToSketchSvg(text: string, width: number, height: number): string {
  const seed = stableSeed(text);
  const tokens = tokenize(text);
  const lines: string[] = [];
  const usableWidth = width - 80;
  const usableHeight = height - 80;
  const baseline = 60;
  const rows = Math.max(3, Math.min(8, Math.ceil(tokens.length / 12)));
  const radius = Math.max(4, Math.min(18, Math.floor(Math.min(width, height) / 70)));

  lines.push(`<rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF"/>`);
  lines.push(`<path d="M 40 ${height - 55} Q ${width * 0.28} ${height - 85} ${width * 0.52} ${height - 60} T ${width - 45} ${height - 70}" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round"/>`);

  for (let row = 0; row < rows; row += 1) {
    const tokenStart = row * 12;
    const rowTokens = tokens.slice(tokenStart, tokenStart + 12);
    const y = baseline + row * (usableHeight / Math.max(3, rows));
    const rowWidth = Math.max(1, rowTokens.length);
    rowTokens.forEach((token, index) => {
      let local = stableSeed(`${seed}:${row}:${index}:${token}`);
      const x = 40 + ((index + 0.5) / rowWidth) * usableWidth;
      const driftX = (local % 33) - 16;
      local = Math.imul(local ^ 0x9e3779b9, 2654435761) >>> 0;
      const driftY = (local % 25) - 12;
      const size = radius + (local % Math.max(2, radius));
      lines.push(`<circle cx="${x + driftX}" cy="${y + driftY}" r="${size}" fill="none" stroke="#111827" stroke-width="3"/>`);
      if (token.length > 2) {
        const endX = x + driftX + size + 8 + (local % 28);
        lines.push(`<path d="M ${x + driftX - size} ${y + driftY} Q ${x + driftX} ${y + driftY - size - 10} ${endX} ${y + driftY + (local % 20) - 10}" fill="none" stroke="#374151" stroke-width="2.5" stroke-linecap="round"/>`);
      }
    });
  }

  const accent = Math.max(2, Math.min(7, tokens.length));
  for (let index = 0; index < accent; index += 1) {
    const local = stableSeed(`${text}:${index}`);
    const x = 55 + (local % Math.max(1, width - 110));
    const y = 32 + ((local >>> 8) % 28);
    lines.push(`<path d="M ${x} ${y} l ${12 + (local % 28)} ${-8 - (local % 18)}" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g>${lines.join('')}</g><text x="40" y="${height - 22}" font-family="sans-serif" font-size="11" fill="#6B7280">Text Sketch • ${escapeXml(text.slice(0, 60))}</text></svg>`;
}

async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/v1/sketch/text') {
    sendJson(res, 404, { error: 'not_found' });
    return;
  }

  try {
    const body = await readJson(req);
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text || text.length > MAX_TEXT_LENGTH) {
      sendJson(res, 400, { error: 'invalid_text' });
      return;
    }
    const width = Math.round(clampNumber(body.width, 320, 2048, 1024));
    const height = Math.round(clampNumber(body.height, 320, 2048, 1024));
    sendJson(res, 200, { svg: textToSketchSvg(text, width, height), width, height });
  } catch (error) {
    sendJson(res, 400, { error: 'bad_request', detail: error instanceof Error ? error.message : 'Unknown error.' });
  }
}

createServer((req, res) => { void handler(req, res); }).listen(PORT, () => {
  console.log(`Text Sketch service listening on ${PORT}`);
});
