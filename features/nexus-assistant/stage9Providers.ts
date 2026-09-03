import { callGateway, discoverGatewayEndpoints, type GatewayEndpoint } from '@/features/api-gateway/apiGatewayClient';

export type AssistantProvider = 'openai' | 'gemini';

export type ProviderResult = {
  text: string;
  provider: AssistantProvider;
};

function rankEndpoint(endpoints: GatewayEndpoint[], terms: string[]): GatewayEndpoint | null {
  return endpoints
    .map((endpoint) => {
      const haystack = `${endpoint.id} ${endpoint.path} ${endpoint.feature ?? ''} ${endpoint.description ?? ''}`.toLowerCase();
      return {
        endpoint,
        score: terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0),
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.endpoint ?? null;
}

function readText(payload: any): string | null {
  const text = payload?.choices?.[0]?.message?.content
    ?? payload?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text).filter(Boolean).join('')
    ?? payload?.output_text
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
  const endpoint = provider === 'openai'
    ? rankEndpoint(endpoints, ['openai', 'responses', 'chat', 'completion'])
    : rankEndpoint(endpoints, ['gemini', 'google', 'generate', 'completion', 'message']);
  if (!endpoint) return null;

  const messages = (input.history ?? []).map((item) => ({
    role: item.role,
    content: item.text,
  }));
  messages.push({ role: 'user', content: input.message });

  const payload = await callGateway<any>(endpoint.path, {
    method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: provider === 'openai'
      ? {
          messages,
          input: input.message,
          model: endpoint.id || undefined,
          temperature: 0.4,
          max_tokens: 900,
        }
      : {
          message: input.message,
          prompt: input.message,
          contents: messages.map((item) => ({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: item.content }],
          })),
          generationConfig: { temperature: 0.4, maxOutputTokens: 900 },
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
    return await askProvider('gemini', input);
  } catch {
    return null;
  }
}
