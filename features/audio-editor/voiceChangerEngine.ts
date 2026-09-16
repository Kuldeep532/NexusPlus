import { assertAudioEditorNative } from '@/modules/audio-editor-native';
import type { VoicePitchProfile } from './voicePitchingEngine';
import { normalizeVoicePitchParameters } from './voicePitchingEngine';
import type { VoiceStudioModel } from './voiceStudio';

export type VoiceChangerInput = {
  inputPath: string;
  outputPath: string;
  profile?: VoicePitchProfile;
  voiceModel?: VoiceStudioModel;
};

export type VoiceChangerResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string | null;
  engine: 'builtin-profile' | 'onnx';
};

export async function changeAudioVoice(input: VoiceChangerInput): Promise<VoiceChangerResult> {
  if (!input.inputPath) throw new Error('Audio file is required.');
  if (!input.outputPath) throw new Error('Output audio path is required.');

  if (input.voiceModel) {
    throw new Error('The selected Voice Studio ONNX model is available locally, but its TTS/voice-conversion tensor contract is not declared yet. Use a built-in voice profile for offline voice changing.');
  }

  if (!input.profile) throw new Error('Choose a voice profile.');
  const parameters = normalizeVoicePitchParameters(input.profile);
  const result = await assertAudioEditorNative().pitchShift(
    input.inputPath,
    input.outputPath,
    parameters.pitchSemitones,
    parameters.formantShift,
    parameters.timbre,
  );

  return { ...result, engine: 'builtin-profile' };
}
