import { callGateway, discoverGatewayEndpoints, type GatewayEndpoint } from '@/features/api-gateway/apiGatewayClient';
import { composeMessage, type ComposedMessage, type MessageContext } from './aiMessageComposer';

export type GeminiGenerationResult = ComposedMessage & { source: 'gemini' | 'local-patterns' };

function findGeminiEndpoint(endpoints: GatewayEndpoint[]): GatewayEndpoint | null {
  const ranked = endpoints
    .map((endpoint) => {
      const text = `${endpoint.id} ${endpoint.path} ${endpoint.feature ?? ''} ${endpoint.description ?? ''}`.toLowerCase();
      let score = 0;
      if (text.includes('gemini')) score += 5;
      if (text.includes('ai')) score += 2;
      if (text.includes('generate') || text.includes('completion') || text.includes('message')) score += 2;
      return { endpoint, score };
    })
    .filter((item) => item.score >= 5)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.endpoint ?? null;
}

function buildPrompt(context: MessageContext): string {
  const language = context.language === 'hi' ? 'Hindi' : context.language === 'en' ? 'English' : 'natural Hinglish';
  const points = context.keyPoints.filter(Boolean).slice(0, 6).join('\n- ');
  return [
    'You are Nexus AI Workflow, a concise productivity message writer.',
    `Write a ${context.tone ?? 'professional'} ${context.purpose} message in ${language}.`,
    'Use only the supplied facts. Do not invent names, dates, times, links, commitments, or claims.',
    'Return JSON with exactly two string fields: subject and body.',
    context.recipientName ? `Recipient: ${context.recipientName}` : '',
    context.senderName ? `Sender: ${context.senderName}` : '',
    context.subject ? `Subject hint: ${context.subject}` : '',
    context.dateTimeText ? `Date/time: ${context.dateTimeText}` : '',
    context.action ? `Requested next step: ${context.action}` : '',
    `Key points:\n- ${points || 'None provided'}`,
  ].filter(Boolean).join('\n');
}

function parseGeminiResponse(payload: any): { subject: string; body: string } | null {
  const candidateText = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text).filter(Boolean).join('')
    ?? payload?.text
    ?? payload?.output
    ?? payload?.response?.text
    ?? payload?.result?.text;

  if (typeof candidateText !== 'string' || !candidateText.trim()) return null;

  const cleaned = candidateText.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed?.subject === 'string' && typeof parsed?.body === 'string') {
      return { subject: parsed.subject.trim(), body: parsed.body.trim() };
    }
  } catch {
    // Some gateways may return plain text. Preserve it as the body instead of failing the workflow.
  }

  return { subject: 'Quick update', body: cleaned };
}

/**
 * Gemini is reached only through the published backend gateway endpoint.
 * No Gemini API key, model SDK, or model weights are shipped in the app.
 */
export async function composeMessageWithGemini(context: MessageContext): Promise<GeminiGenerationResult> {
  const localFallback = composeMessage(context);

  try {
    const endpoints = await discoverGatewayEndpoints();
    const endpoint = findGeminiEndpoint(endpoints);
    if (!endpoint) return localFallback;

    const prompt = buildPrompt(context);
    const payload = await callGateway<any>(endpoint.path, {
      method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      body: {
        prompt,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
      },
    });

    const message = parseGeminiResponse(payload);
    if (!message?.body) return localFallback;

    return {
      subject: message.subject || localFallback.subject,
      body: message.body,
      language: context.language ?? 'hinglish',
      source: 'gemini',
    };
  } catch {
    // Backend/Gemini outages never break the core productivity workflow.
    return localFallback;
  }
}
