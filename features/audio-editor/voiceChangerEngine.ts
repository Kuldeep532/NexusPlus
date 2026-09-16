import { assertAudioEditorNative } from '@/modules/audio-editor-native';
import type { VoicePitchProfile } from './voicePitchingEngine';
import { normalizeVoicePitchParameters } from './voicePitchingEngine';
import type { StoredVoiceModel } from './voiceModelStorage';

export type VoiceChangerInput = {
  inputPath: string;
  outputPath: string;
  profile?: VoicePitchProfile;
  voiceModel?: StoredVoiceModel;
};

export async function changeAudioVoice(input: VoiceChangerInput) {
  if (!input.inputPath) throw new Error('Audio file is required.');
  if (!input.outputPath) throw new Error('Output audio path is required.');

  if (input.voiceModel?.kind === 'onnx') {
    throw new Error('An ONNX voice model was selected, but its model architecture is not known yet. Import is supported; inference requires a model-specific adapter instead of guessing tensor inputs.');
  }

  if (!input.profile) throw new Error('Choose a voice profile.');
  const parameters = normalizeVoicePitchParameters(input.profile);
  return assertAudioEditorNative().pitchShift(
    input.inputPath,
    input.outputPath,
    parameters.pitchSemitones,
    parameters.formantShift,
    parameters.timbre,
  );
}
