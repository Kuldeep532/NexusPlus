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
    throw new Error('This ONNX voice model is stored locally, but its inference contract is not recognized. Select a built-in voice profile or add a compatible ONNX adapter.');
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
