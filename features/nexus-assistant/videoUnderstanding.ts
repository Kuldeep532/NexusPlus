import { callGateway, discoverGatewayEndpoints } from '@/features/api-gateway/apiGatewayClient';

type VideoUnderstandingRequest = {
  uri: string;
  mimeType: string;
  prompt: string;
};

export type VideoUnderstandingResult = {
  text: string;
};

function readText(payload: any): string | null {
  const text = payload?.output_text
    ?? payload?.text
    ?? payload?.output?.text
    ?? payload?.result?.text
    ?? payload?.response?.text
    ?? payload?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text).filter(Boolean).join('');
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

function findVideoEndpoint(endpoints: Awaited<ReturnType<typeof discoverGatewayEndpoints>>) {
  return endpoints
    .map((endpoint) => {
      const haystack = `${endpoint.id} ${endpoint.path} ${endpoint.feature ?? ''} ${endpoint.description ?? ''}`.toLowerCase();
      let score = 0;
      if (haystack.includes('video')) score += 8;
      if (haystack.includes('multimodal')) score += 5;
      if (haystack.includes('gemini')) score += 4;
      if (haystack.includes('file')) score += 2;
      if (haystack.includes('interaction')) score += 2;
      return { endpoint, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)[0]?.endpoint ?? null;
}

/**
 * Sends the local video through the authenticated Gateway using a multimodal
 * video input contract. The Gateway owns provider credentials and decides the
 * concrete Gemini/OpenAI implementation; the app never receives provider keys.
 *
 * The app does not flatten video into a text transcript first because modern
 * multimodal models can reason over audio + sampled visual frames together.
 */
export async function understandVideo(input: VideoUnderstandingRequest): Promise<VideoUnderstandingResult> {
  if (!input.uri.trim()) throw new Error('VIDEO_URI_REQUIRED');
  if (!input.mimeType.startsWith('video/')) throw new Error('VIDEO_MIME_TYPE_REQUIRED');

  const endpoints = await discoverGatewayEndpoints();
  const endpoint = findVideoEndpoint(endpoints);
  if (!endpoint) throw new Error('VIDEO_UNDERSTANDING_UNAVAILABLE');

  const payload = await callGateway<any>(endpoint.path, {
    method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: {
      model: endpoint.id || undefined,
      video: {
        uri: input.uri,
        mime_type: input.mimeType,
        processing: 'agentic',
      },
      input: [{ type: 'video', uri: input.uri, mime_type: input.mimeType, processing: 'agentic' }, { type: 'text', text: input.prompt }],
      prompt: input.prompt,
      mime_type: input.mimeType,
    },
  });

  const text = readText(payload);
  if (!text) throw new Error('VIDEO_UNDERSTANDING_EMPTY');
  return { text };
}
