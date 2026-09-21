import { AudioEditorNative, assertAudioEditorNative } from '@/modules/audio-editor-native';

export type AudioEffectType = 'volume' | 'fade-in' | 'fade-out' | 'normalize';

export type AudioEffectInput = {
  inputPath: string;
  outputPath: string;
  effect: AudioEffectType;
  startMs?: number;
  endMs?: number;
  amount?: number;
};

export type AudioEffectResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string | null;
};

export function assertAudioEffectsNative() {
  return {
    apply: (input: AudioEffectInput): Promise<AudioEffectResult> =>
      assertAudioEditorNative().applyEffect(input),
  };
}

export function isAudioEffectsNativeAvailable(): boolean {
  return Boolean(AudioEditorNative?.applyEffect);
}
