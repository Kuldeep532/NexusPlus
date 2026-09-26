import { callGateway, discoverGatewayEndpoints, type GatewayEndpoint } from '@/features/api-gateway/apiGatewayClient';
import { getAssistantModelPreference } from './aiModelPreferences';
import { getCustomProviderApiKey } from './aiProviderPreferences';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
import { SUPABASE_URL } from '@/features/auth/authConfig';

export type AssistantProvider = 'gemini' | 'openai' | 'anthropic';

export type ProviderResult = {
  text: string;
  provider: AssistantProvider;
};

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

function rankGatewayEndpoint(endpoints: GatewayEndpoint[], provider: Exclude<AssistantProvider, 'anthropic'>): GatewayEndpoint | null {
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

async function askGatewayProvider(provider: Exclude<AssistantProvider, 'anthropic'>, input: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<ProviderResult | null> {
  const endpoints = await discoverGatewayEndpoints();
  const endpoint = rankGatewayEndpoint(endpoints, provider);
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
      contents: messages.map((item) => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.content }] })),
      generationConfig: { temperature: 0.4, maxOutputTokens: 900 },
      max_tokens: 900,
    },
  });
  const text = readText(payload);
  return text ? { text, provider } : null;
}

async function askOwnOpenAiKey(input: { message: string; history?: Array<{ role: 'user' | 'assistant'; text: string }> }, key: string): Promise<ProviderResult | null> {
  const messages = (input.history ?? []).map((item) => ({ role: item.role, content: item.text }));
  messages.push({ role: 'user', content: input.message });
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ model: 'gpt-4.1-mini', messages, temperature: 0.4, max_tokens: 900 }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(String(payload?.error?.message ?? 'OPENAI_REQUEST_FAILED'));
  const text = readText(payload);
  return text ? { text, provider: 'openai' } : null;
}

async function askOwnAnthropicKey(input: { message: string; history?: Array<{ role: 'user' | 'assistant'; text: string }> }, key: string): Promise<ProviderResult | null> {
  const system = 'You are Nexus Assistant. Answer clearly and helpfully.';
  const messages = (input.history ?? []).filter((item) => item.role === 'user' || item.role === 'assistant').map((item) => ({ role: item.role, content: item.text }));
  messages.push({ role: 'user', content: input.message });
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ model: 'claude-3-5-haiku-latest', max_tokens: 900, temperature: 0.4, system, messages }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(String(payload?.error?.message ?? 'ANTHROPIC_REQUEST_FAILED'));
  const text = Array.isArray(payload?.content) ? payload.content.map((item: any) => item?.text).filter(Boolean).join('') : null;
  return text ? { text, provider: 'anthropic' } : null;
}

async function hasPremiumAccess(): Promise<boolean> {
  const token = await getSupabaseAccessToken();
  if (!token || !SUPABASE_URL) return false;
  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_my_premium_entitlement', {
      method: 'POST',
      headers: { apikey: token, Authorization: 'Bearer ' + token, 'content-type': 'application/json', Accept: 'application/json' },
      body: '{}',
    });
    if (!response.ok) return false;
    const payload = await response.json();
    const row = Array.isArray(payload) ? payload[0] : payload;
    return Number(row?.tierLevel ?? 1) >= 2 && String(row?.status ?? '').toUpperCase() === 'ACTIVE';
  } catch {
    return false;
  }
}

async function askSelectedPremiumOrOwnKey(provider: 'openai' | 'anthropic', input: { message: string; history?: Array<{ role: 'user' | 'assistant'; text: string }> }): Promise<ProviderResult | null> {
  const personalKey = await getCustomProviderApiKey(provider);
  if (personalKey) {
    return provider === 'openai' ? askOwnOpenAiKey(input, personalKey) : askOwnAnthropicKey(input, personalKey);
  }
  if (!await hasPremiumAccess()) throw new Error('PREMIUM_MODEL_REQUIRED_' + provider.toUpperCase());
  if (provider === 'openai') {
    return askGatewayProvider('openai', input);
  }
  // Anthropic is kept behind the same authenticated model gateway when Premium.
  const endpoints = await discoverGatewayEndpoints();
  const endpoint = endpoints.find((item) => {
    const h = `${item.id} ${item.path} ${item.feature ?? ''} ${item.description ?? ''}`.toLowerCase();
    return h.includes('anthropic') || h.includes('claude');
  });
  if (!endpoint) throw new Error('ANTHROPIC_GATEWAY_NOT_CONFIGURED');
  const messages = (input.history ?? []).map((item) => ({ role: item.role, content: item.text }));
  messages.push({ role: 'user', content: input.message });
  const payload = await callGateway<any>(endpoint.path, {
    method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: { model: endpoint.id || undefined, messages, input: input.message, max_tokens: 900, temperature: 0.4 },
  });
  const text = readText(payload);
  return text ? { text, provider: 'anthropic' } : null;
}

export async function askCloudWithFallback(input: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<ProviderResult | null> {
  const preference = await getAssistantModelPreference();

  if (preference.selectedModel === 'gemini') {
    try { return await askGatewayProvider('gemini', input); } catch { return null; }
  }

  try {
    return await askSelectedPremiumOrOwnKey(preference.selectedModel, input);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('PREMIUM_MODEL_REQUIRED_')) throw error;
    throw error;
  }
}
