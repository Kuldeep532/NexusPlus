import { z } from 'zod';

const TextSketchResponseSchema = z.object({
  svg: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type TextSketchRequest = {
  text: string;
  width?: number;
  height?: number;
};

export type TextSketchResponse = z.infer<typeof TextSketchResponseSchema>;

function gatewayUrl(): string {
  const url = process.env.EXPO_PUBLIC_SKETCH_AI_GATEWAY_URL;
  if (!url) throw new Error('Text Sketch service is not configured.');
  return url.replace(/\/$/, '');
}

export async function generateSketchFromText(request: TextSketchRequest, signal?: AbortSignal): Promise<TextSketchResponse> {
  const response = await fetch(`${gatewayUrl()}/v1/sketch/text`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Text Sketch service returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}.`);
  }
  const parsed = TextSketchResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error('Text Sketch service returned an invalid SVG sketch.');
  return parsed.data;
}
