import { getAssistantModelPreference, type AssistantModelId } from './aiModelPreferences';
import { getCustomProviderApiKey } from './aiProviderPreferences';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
import { SUPABASE_URL } from '@/features/auth/authConfig';

export type AssistantProvider = AssistantModelId;

export type ProviderResult = {
  text: string;
  provider: AssistantProvider;
  model?: string;
};

function parseProviderError(status: number, payload: any): Error {
  const message = String(payload?.error ?? payload?.message ?? 'AI_REQUEST_FAILED');
  return new Error(message || `AI_REQUEST_${status}`);
}

function readText(payload: any): string | null {
  const value =
    payload?.text ??
    payload?.output_text ??
    payload?.choices?.[0]?.message?.content ??
    payload?.choices?.[0]?.text ??
    payload?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text).filter(Boolean).join('') ??
    payload?.content?.map?.((item: any) => item?.text).filter(Boolean).join('') ??
    payload?.response?.text ??
    payload?.result?.text;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function callSupabaseAiFunction(provider: AssistantModelId, input: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<ProviderResult | null> {
  const token = await getSupabaseAccessToken();
  if (!token || !SUPABASE_URL) throw new Error('AUTH_REQUIRED');

  const response = await fetch(SUPABASE_URL + '/functions/v1/nexus-ai-chat', {
    method: 'POST',
    headers: {
      apikey: token,
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      provider,
      message: input.message,
      history: (input.history ?? []).slice(-20),
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw parseProviderError(response.status, payload);
  const text = readText(payload);
  return text ? { text, provider, model: payload?.model } : null;
}

async function askOwnOpenAiKey(input: { message: string; history?: Array<{ role: 'user' | 'assistant'; text: string }> }, key: string): Promise<ProviderResult | null> {
  const messages = (input.history ?? []).map((item) => ({ role: item.role, content: item.text }));
  messages.push({ role: 'user', content: input.message });
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ model: 'gpt-5.6-luna', input: messages.map((item) => ({ role: item.role, content: [{ type: 'input_text', text: item.content }] })), max_output_tokens: 900 }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(String(payload?.error?.message ?? 'OPENAI_REQUEST_FAILED'));
  const text = readText(payload);
  return text ? { text, provider: 'openai', model: payload?.model } : null;
}

async function askOwnAnthropicKey(input: { message: string; history?: Array<{ role: 'user' | 'assistant'; text: string }> }, key: string): Promise<ProviderResult | null> {
  const messages = (input.history ?? []).map((item) => ({ role: item.role, content: item.text }));
  messages.push({ role: 'user', content: input.message });
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ model: 'claude-3-7-sonnet-latest', max_tokens: 900, temperature: 0.4, system: 'You are Nexus Assistant. Answer clearly and helpfully.', messages }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(String(payload?.error?.message ?? 'ANTHROPIC_REQUEST_FAILED'));
  const text = readText(payload);
  return text ? { text, provider: 'anthropic', model: payload?.model } : null;
}

export async function askCloudWithFallback(input: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<ProviderResult | null> {
  const preference = await getAssistantModelPreference();
  const selectedModel = preference.selectedModel;

  if (selectedModel === 'gemini') {
    try {
      return await callSupabaseAiFunction('gemini', input);
    } catch {
      return null;
    }
  }

  const personalKey = await getCustomProviderApiKey(selectedModel);
  if (personalKey) {
    return selectedModel === 'openai'
      ? askOwnOpenAiKey(input, personalKey)
      : askOwnAnthropicKey(input, personalKey);
  }

  return callSupabaseAiFunction(selectedModel, input);
}
