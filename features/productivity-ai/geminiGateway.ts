const GATEWAY_URL = 'https://api-gateway.kuldeepky538.workers.dev/';
const GATEWAY_PUBLIC_KEY = 'MCowBQYDK2VwAyEAa4ZxuobCuaSe+HMbCc7YW7AG/W5SELvpc7NNBVX9ab4=';

export type GeminiLanguage = 'en-IN' | 'hi-IN';

export type GeminiGenerateInput = {
  instruction: string;
  context: string;
  language: GeminiLanguage;
  maxOutputTokens?: number;
};

export type GeminiGenerateResult = { text: string; model?: string };

/**
 * Nexus Plus never stores a Gemini secret in the APK. Requests go through the
 * user's Cloudflare Worker gateway. The supplied public key is only an
 * identifier for the gateway; it is not treated as a secret credential.
 *
 * The worker response is intentionally accepted in a few common shapes so
 * the app stays small and the gateway can evolve independently.
 */
export async function generateWithGemini(input: GeminiGenerateInput): Promise<GeminiGenerateResult> {
  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Nexus-Public-Key': GATEWAY_PUBLIC_KEY,
    },
    body: JSON.stringify({
      provider: 'gemini',
      task: 'generate',
      language: input.language,
      instruction: input.instruction,
      context: input.context,
      maxOutputTokens: Math.min(Math.max(input.maxOutputTokens ?? 700, 64), 1200),
    }),
  });

  if (!response.ok) throw new Error(`GEMINI_GATEWAY_HTTP_${response.status}`);
  const payload = await response.json() as { text?: string; output?: string; response?: { text?: string }; model?: string; error?: string };
  const text = payload.text ?? payload.output ?? payload.response?.text;
  if (!text) throw new Error(payload.error || 'GEMINI_GATEWAY_EMPTY_RESPONSE');
  return { text: text.trim(), model: payload.model };
}

export { GATEWAY_URL as NEXUS_AI_GATEWAY_URL };
