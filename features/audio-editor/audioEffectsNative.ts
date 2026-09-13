import { AudioEditorNative, assertAudioEditorNative, type AudioMixInput, type AudioMixResult } from '@/modules/audio-editor-native';

export type AudioEffectMix = {
  inputPath: string;
  effectPath: string;
  outputPath: string;
  effectStartMs: number;
  effectEndMs: number;
  volume: number;
};

export type AudioEffectMixResult = AudioMixResult;

export function assertAudioEffectsNative() {
  return {
    mix: (input: AudioEffectMix) => {
      const request: AudioMixInput = {
        inputPath: input.inputPath,
        overlayPath: input.effectPath,
        outputPath: input.outputPath,
        overlayStartMs: input.effectStartMs,
        overlayVolume: input.volume,
      };
      return assertAudioEditorNative().mix(request);
    },
  };
}

export function isAudioEffectsNativeAvailable(): boolean {
  return Boolean(AudioEditorNative);
}
