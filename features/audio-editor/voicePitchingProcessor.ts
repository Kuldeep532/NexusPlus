import { assertAudioEditorNative } from '@/modules/audio-editor-native';
import type { VoicePitchProfile } from './voicePitchingEngine';
import { normalizeVoicePitchParameters } from './voicePitchingEngine';

export type VoicePitchProcessInput = {
  inputPath: string;
  outputPath: string;
  profile: VoicePitchProfile;
};

export type VoicePitchProcessResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string | null;
  pitchSemitones: number;
  formantShift: number;
  timbre: number;
};

export async function processVoicePitch(input: VoicePitchProcessInput): Promise<VoicePitchProcessResult> {
  if (!input.inputPath) throw new Error('Recorded audio path is required.');
  if (!input.outputPath) throw new Error('Output audio path is required.');

  const parameters = normalizeVoicePitchParameters(input.profile);
  const result = await assertAudioEditorNative().pitchShift(
    input.inputPath,
    input.outputPath,
    parameters.pitchSemitones,
    parameters.formantShift,
    parameters.timbre,
  );

  return {
    ...result,
    pitchSemitones: parameters.pitchSemitones,
    formantShift: parameters.formantShift,
    timbre: parameters.timbre,
  };
}
