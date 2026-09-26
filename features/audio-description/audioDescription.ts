import { callGateway } from '@/features/api-gateway/apiGatewayClient';

export type AudioDescriptionMode = 'basic' | 'advanced';
export type AudioDescriptionRequest = {
  uri: string; mimeType?: string; language: string; mode: AudioDescriptionMode; customInstruction?: string; durationSeconds?: number;
};
export type AudioDescriptionResult = {
  description: string; provider: 'gemini'; mode: AudioDescriptionMode; creditsCharged: number;
};

function guessMime(uri: string, mimeType?: string): string {
  if (mimeType?.startsWith('video/')) return mimeType;
  const ext = uri.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
  return ({mp4:'video/mp4',mov:'video/quicktime',m4v:'video/x-m4v',webm:'video/webm',avi:'video/x-msvideo',mkv:'video/x-matroska',mpeg:'video/mpeg',mpg:'video/mpeg',wmv:'video/x-ms-wmv','3gp':'video/3gpp'} as Record<string,string>)[ext ?? ''] ?? 'video/mp4';
}

function buildPrompt(language: string, mode: AudioDescriptionMode, customInstruction?: string): string {
  const parts = [
    'Create an accessibility-focused audio description for a blind or low-vision viewer.',
    'Write the narration in ' + (language || 'the selected language') + '.',
    'Describe visually meaningful information needed to understand what is happening: people, actions, objects, scene changes, readable on-screen text, spatial relationships and important visual cues.',
    'Do not invent details that are not supported by the video.',
    'Avoid phrases such as “we can see”; write naturally as spoken narration.',
  ];
  if (mode === 'advanced') parts.push('Provide rich scene-by-scene narration with concise timestamps for important changes, continuity, movement, locations, gestures and meaningful non-speech visual events.');
  else parts.push('Keep the narration concise and focus on the most important scenes and actions. Return one clean narration script.');
  if (customInstruction?.trim()) parts.push('Additional user instruction: ' + customInstruction.trim());
  return parts.join(' ');
}

export async function createAudioDescription(input: AudioDescriptionRequest): Promise<AudioDescriptionResult> {
  const mimeType = guessMime(input.uri, input.mimeType);
  if (!mimeType.startsWith('video/')) throw new Error('VIDEO_MIME_TYPE_REQUIRED');

  const creditsCharged = input.mode === 'advanced' ? 12 : 4;
  const featureCode = input.mode === 'advanced' ? 'audio_description_advanced' : 'audio_description_basic';
  await callGateway('/ai/credits/consume', {
    method: 'POST',
    body: { featureCode, mode: input.mode, durationSeconds: input.durationSeconds, credits: creditsCharged },
  });

  try {
    const payload = await callGateway<Record<string, unknown>>('/ai/video/audio-description', {
      method: 'POST',
      body: {
        media: { uri: input.uri, mimeType, displayName: 'Nexus Plus audio description video' },
        prompt: buildPrompt(input.language, input.mode, input.customInstruction),
        mode: input.mode,
        multimodal: true,
        processing: input.mode === 'advanced' ? 'agentic' : 'static',
        modelClass: input.mode === 'advanced' ? 'premium' : 'basic',
        responseFormat: 'text',
      },
    });
    const description = [payload.output_text,payload.text,payload.description]
      .find((v): v is string => typeof v === 'string' && v.trim().length > 0)?.trim();
    if (!description) throw new Error('AUDIO_DESCRIPTION_EMPTY');
    return { description, provider:'gemini', mode:input.mode, creditsCharged };
  } catch (error) {
    try {
      await callGateway('/ai/credits/refund', {
        method: 'POST',
        body: { featureCode, mode: input.mode, credits: creditsCharged },
      });
    } catch {}
    throw error;
  }
}