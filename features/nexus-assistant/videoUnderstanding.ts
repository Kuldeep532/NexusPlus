import { callGateway } from '@/features/api-gateway/apiGatewayClient';

export type VideoUnderstandingRequest = {
  uri: string;
  mimeType?: string;
  prompt: string;
  displayName?: string;
};

export type VideoUnderstandingResult = {
  text: string;
  mediaName?: string;
  provider: 'gemini';
};

type GatewayVideoResponse = {
  text?: unknown;
  output_text?: unknown;
  response?: { text?: unknown };
  result?: { text?: unknown };
  mediaName?: unknown;
};

function readText(payload: GatewayVideoResponse): string | null {
  const value = payload?.output_text
    ?? payload?.text
    ?? payload?.response?.text
    ?? payload?.result?.text;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeMimeType(uri: string, mimeType?: string): string {
  if (mimeType?.trim()) return mimeType.trim();
  const extension = uri.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
  const byExtension: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    '3gp': 'video/3gpp',
  };
  return byExtension[extension ?? ''] ?? 'video/mp4';
}

/**
 * Mobile-side adapter for the Nexus Gateway's Gemini multimodal video route.
 * Provider credentials stay server-side. The gateway performs media upload/
 * processing before asking Gemini to reason over video + audio + visuals.
 */
export async function understandVideo(input: VideoUnderstandingRequest): Promise<VideoUnderstandingResult> {
  if (!input.uri.trim()) throw new Error('VIDEO_URI_REQUIRED');
  const mimeType = normalizeMimeType(input.uri, input.mimeType);
  if (!mimeType.startsWith('video/')) throw new Error('VIDEO_MIME_TYPE_REQUIRED');

  const payload = await callGateway<GatewayVideoResponse>('/ai/video/understand', {
    method: 'POST',
    body: {
      media: {
        uri: input.uri,
        mimeType,
        displayName: input.displayName ?? 'NexusPlus video',
      },
      prompt: input.prompt,
      multimodal: true,
      processing: 'agentic',
      responseFormat: 'text',
    },
  });

  const text = readText(payload);
  if (!text) throw new Error('VIDEO_UNDERSTANDING_EMPTY');
  return {
    text,
    mediaName: typeof payload.mediaName === 'string' ? payload.mediaName : undefined,
    provider: 'gemini',
  };
}
