import { callGateway, discoverGatewayEndpoints, type GatewayEndpoint } from '@/features/api-gateway/apiGatewayClient';

export type AssistantProvider = 'openai' | 'gemini';

export type ProviderResult = {
  text: string;
  provider: AssistantProvider;
};

function rankEndpoint(endpoints: GatewayEndpoint[], provider: AssistantProvider): GatewayEndpoint | null {
  const ranked = endpoints.map((endpoint) => {
    const haystack = `${endpoint.id} ${endpoint.path} ${endpoint.feature ?? ''} ${endpoint.description ?? ''}`.toLowerCase();
    let score = 0;
    if (provider === 'openai') {
      if (haystack.includes('openai')) score += 8;
      if (haystack.includes('responses')) score += 3;
      if (haystack.includes('chat')) score += 2;
      if (haystack.includes('completion')) score += 2;
    } else {
      if (haystack.includes('gemini')) score += 8;
      if (haystack.includes('google')) score += 3;
      if (haystack.includes('generate')) score += 2;
      if (haystack.includes('completion') || haystack.includes('message')) score += 2;
    }
    return { endpoint, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  return ranked[0]?.endpoint ?? null;
}

function readText(payload: any): string | null {
  const text = payload?.choices?.[0]?.message?.content
    ?? payload?.choices?.[0]?.text
    ?? payload?.output_text
    ?? payload?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text).filter(Boolean).join('')
    ?? payload?.text
    ?? payload?.output
    ?? payload?.response?.text
    ?? payload?.result?.text;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

async function askProvider(provider: AssistantProvider, input: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<ProviderResult | null> {
  const endpoints = await discoverGatewayEndpoints();
  const endpoint = rankEndpoint(endpoints, provider);
  if (!endpoint) return null;

  const messages = (input.history ?? []).map((item) => ({ role: item.role, content: item.text }));
  messages.push({ role: 'user', content: input.message });

  const payload = await callGateway<any>(endpoint.path, {
    method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: {
      model: endpoint.id || undefined,
      messages,
      input: input.message,
      prompt: input.message,
      contents: messages.map((item) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }],
      })),
      generationConfig: { temperature: 0.4, maxOutputTokens: 900 },
      max_tokens: 900,
    },
  });

  const text = readText(payload);
  return text ? { text, provider } : null;
}

/**
 * Provider policy: try OpenAI through the authenticated Nexus/Cloudflare Gateway,
 * then Gemini through the same gateway. If OpenAI is not configured server-side,
 * its failure is non-fatal and Gemini remains the fallback.
 */
export async function askCloudWithFallback(input: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<ProviderResult | null> {
  try {
    const openai = await askProvider('openai', input);
    if (openai) return openai;
  } catch {
    // Optional provider: continue to Gemini.
  }

  try {
    const gemini = await askProvider('gemini', input);
    return gemini;
  } catch {
    return null;
  }
}