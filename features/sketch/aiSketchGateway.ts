import { z } from 'zod';

const AiSketchResponseSchema = z.object({
  dataUrl: z.string().startsWith('data:').optional(),
  imageUrl: z.string().url().optional(),
  svg: z.string().optional(),
  mimeType: z.string().optional(),
  model: z.string().optional(),
});

export type AiSketchRequest = {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
  seed?: number;
  model?: string;
};

export type AiSketchResponse = z.infer<typeof AiSketchResponseSchema>;

function gatewayUrl(): string {
  const url = process.env.EXPO_PUBLIC_SKETCH_AI_GATEWAY_URL;
  if (!url) throw new Error('AI sketch gateway is not configured.');
  return url.replace(/\/$/, '');
}

export async function generateAiSketch(request: AiSketchRequest, signal?: AbortSignal): Promise<AiSketchResponse> {
  const response = await fetch(`${gatewayUrl()}/v1/sketch/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Sketch AI gateway returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}.`);
  }
  const parsed = AiSketchResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error('Sketch AI gateway returned an invalid response.');
  if (!parsed.data.dataUrl && !parsed.data.imageUrl && !parsed.data.svg) throw new Error('Sketch AI gateway returned no sketch asset.');
  return parsed.data;
}
