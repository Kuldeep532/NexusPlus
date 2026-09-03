import { callGateway, discoverGatewayEndpoints, type GatewayEndpoint } from '@/features/api-gateway/apiGatewayClient';

type AssistantGatewayResult = {
  text: string;
  source: 'gemini' | 'weather';
};

function findEndpoint(endpoints: GatewayEndpoint[], terms: string[]): GatewayEndpoint | null {
  const ranked = endpoints
    .map((endpoint) => {
      const haystack = `${endpoint.id} ${endpoint.path} ${endpoint.feature ?? ''} ${endpoint.description ?? ''}`.toLowerCase();
      const score = terms.reduce((value, term) => value + (haystack.includes(term) ? 1 : 0), 0);
      return { endpoint, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.endpoint ?? null;
}

export async function askGeminiThroughGateway(input: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<AssistantGatewayResult | null> {
  const endpoints = await discoverGatewayEndpoints();
  const endpoint = findEndpoint(endpoints, ['gemini', 'ai', 'generate', 'completion', 'message']);
  if (!endpoint) return null;

  const payload = await callGateway<any>(endpoint.path, {
    method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: {
      message: input.message,
      prompt: input.message,
      contents: [
        ...(input.history ?? []).map((item) => ({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.text }],
        })),
        { role: 'user', parts: [{ text: input.message }] },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
    },
  });

  const text = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text).filter(Boolean).join('')
    ?? payload?.text
    ?? payload?.output
    ?? payload?.response?.text
    ?? payload?.result?.text;

  if (typeof text !== 'string' || !text.trim()) return null;
  return { text: text.trim(), source: 'gemini' };
}

export async function getWeatherThroughGateway(input: {
  location?: string;
  latitude?: number;
  longitude?: number;
}): Promise<AssistantGatewayResult | null> {
  const endpoints = await discoverGatewayEndpoints();
  const endpoint = findEndpoint(endpoints, ['weather', 'forecast', 'temperature']);
  if (!endpoint) return null;

  const payload = await callGateway<any>(endpoint.path, {
    method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    query: endpoint.method === 'GET' ? {
      location: input.location,
      lat: input.latitude,
      lon: input.longitude,
    } : undefined,
    body: endpoint.method === 'GET' ? undefined : {
      location: input.location,
      latitude: input.latitude,
      longitude: input.longitude,
    },
  });

  const text = payload?.text
    ?? payload?.summary
    ?? payload?.message
    ?? (payload?.current ? JSON.stringify(payload.current) : null)
    ?? (payload?.weather ? JSON.stringify(payload.weather) : null);

  if (typeof text !== 'string' || !text.trim()) return null;
  return { text: text.trim(), source: 'weather' };
}

export function looksLikeWeatherRequest(message: string): boolean {
  return /\b(weather|forecast|temperature|rain|raining|humidity|wind)\b|मौसम|तापमान|बारिश|हवा/i.test(message);
}
