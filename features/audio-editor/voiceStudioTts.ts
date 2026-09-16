import type { VoiceStudioModel } from './voiceStudio';

export type VoiceStudioTtsRequest = {
  text: string;
  model: VoiceStudioModel;
  outputPath: string;
  language?: string;
  rate?: number;
};

export type VoiceStudioTtsResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  mimeType: string;
};

export type VoiceStudioTtsCapability = {
  supported: boolean;
  reason?: string;
};

/**
 * Voice Studio is intentionally TTS-only: the model is used to synthesize speech
 * from text. It never accepts microphone samples for cloning/training.
 */
export function validateVoiceStudioTtsRequest(input: VoiceStudioTtsRequest): void {
  if (!input.text.trim()) throw new Error('Enter text to generate speech.');
  if (input.text.length > 1_000_000) throw new Error('Text is too large for one offline generation job.');
  if (input.model.kind !== 'onnx') throw new Error('Voice Studio requires an ONNX TTS voice model.');
  if (!input.outputPath) throw new Error('An output path is required.');
}

/** Generic ONNX models are not assumed to be TTS models. */
export function getVoiceStudioTtsCapability(model: VoiceStudioModel): VoiceStudioTtsCapability {
  return {
    supported: false,
    reason: 'This model needs a declared Voice Studio TTS adapter describing its text, speaker and audio output tensors.',
  };
}
