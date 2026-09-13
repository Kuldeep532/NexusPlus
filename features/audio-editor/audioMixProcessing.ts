import { assertAudioEditorNative, type AudioMixInput, type AudioMixResult } from '@/modules/audio-editor-native';

export async function mixAudio(input: AudioMixInput): Promise<AudioMixResult> {
  if (!input.inputPath || !input.overlayPath || !input.outputPath) {
    throw new Error('Base audio, overlay audio, and output path are required.');
  }
  if (!Number.isFinite(input.overlayStartMs) || input.overlayStartMs < 0) {
    throw new Error('Overlay start time must be a non-negative number.');
  }
  if (!Number.isFinite(input.overlayVolume) || input.overlayVolume < 0 || input.overlayVolume > 2) {
    throw new Error('Overlay volume must be between 0 and 2.');
  }
  return assertAudioEditorNative().mix(input);
}
