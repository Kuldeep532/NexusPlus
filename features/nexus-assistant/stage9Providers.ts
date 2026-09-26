import { getAssistantModelPreference, type AssistantModelId } from './aiModelPreferences';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
import { APP_API_BASE_URL } from '@/features/api-gateway/apiGatewayClient';

export type AssistantProvider = AssistantModelId;

export type ProviderResult = {
  text: string;
  provider: AssistantProvider;
  model?: string;
};

function parseProviderError(status: number, payload: any): Error {
  const message = String(payload?.error ?? payload?.message ?? 'AI_REQUEST_FAILED');
  return new Error(message || 'AI_REQUEST_' + status);
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

async function callGatewayAiFunction(provider: AssistantModelId, input: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<ProviderResult | null> {
  const token = await getSupabaseAccessToken();
  if (!token || !APP_API_BASE_URL) throw new Error('AUTH_REQUIRED');

  const response = await fetch(APP_API_BASE_URL + '/functions/nexus-ai-chat', {
    method: 'POST',
    headers: {
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

export async function askCloudWithFallback(input: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<ProviderResult | null> {
  const preference = await getAssistantModelPreference();
  const selectedModel = preference.selectedModel;

  if (selectedModel === 'gemini') {
    try {
      return await callGatewayAiFunction('gemini', input);
    } catch {
      return null;
    }
  }

  return callGatewayAiFunction(selectedModel, input);
}
