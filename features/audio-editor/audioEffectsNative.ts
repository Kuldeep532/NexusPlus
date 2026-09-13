import { requireOptionalNativeModule } from 'expo-modules-core';

export type AudioEffectMix = {
  inputPath: string;
  effectPath: string;
  outputPath: string;
  effectStartMs: number;
  effectEndMs: number;
  volume: number;
};

export type AudioEffectMixResult = {
  outputPath: string;
  durationMs: number;
};

type AudioEffectsNativeApi = {
  mix(input: AudioEffectMix): Promise<AudioEffectMixResult>;
};

const nativeModule = requireOptionalNativeModule<AudioEffectsNativeApi>('AudioEditorNative');

export function assertAudioEffectsNative(): AudioEffectsNativeApi {
  if (!nativeModule) {
    throw new Error('Audio Effects native module is not available in this build.');
  }
  return nativeModule;
}
