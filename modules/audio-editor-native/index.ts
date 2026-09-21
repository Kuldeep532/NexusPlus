import { requireOptionalNativeModule } from 'expo-modules-core';

export type AudioProbeResult = {
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string | null;
};

export type DecodedAudioResult = {
  sampleRate: number;
  channels: number;
  durationMs: number;
  samples: number[];
};

export type AudioTrimResult = {
  outputPath: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  mimeType: string | null;
  samples?: number;
};

export type AudioMixClip = {
  path: string;
  startMs: number;
  volume: number;
};

export type AudioMixInput = {
  inputPath: string;
  overlayPath: string;
  overlayStartMs: number;
  overlayVolume: number;
  outputPath: string;
};

export type AudioMixProjectInput = {
  basePath: string;
  overlays: AudioMixClip[];
  outputPath: string;
};

export type AudioMixResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string | null;
};

export type AudioEffectInput = {
  inputPath: string;
  outputPath: string;
  effect: 'volume' | 'fade-in' | 'fade-out' | 'normalize';
  startMs?: number;
  endMs?: number;
  amount?: number;
};

export type AudioEffectResult = AudioMixResult;

export type AudioCompressionPreset = {
  id: string;
  title: string;
  bitrateKbps: number;
  sampleRateHz: number;
};

export type AudioCompressionInput = {
  inputPath: string;
  outputPath: string;
  bitrateKbps: number;
  sampleRateHz: number;
};

export type AudioCompressionResult = AudioMixResult & {
  bitrateKbps: number;
  inputSizeBytes?: number;
  outputSizeBytes?: number;
  encodedBytes?: number;
  decodedPcmBytes?: number;
};

export type PiperSynthesizeInput = {
  text: string;
  modelPath: string;
  configPath: string;
  lengthScale?: number;
  pitchScale?: number;
  emotion?: string;
  clone?: boolean;
};

export type PiperSynthesizeResult = {
  outputPath: string;
};

type AudioEditorNativeModuleType = {
  probe(inputPath: string): Promise<AudioProbeResult>;
  decode(inputPath: string): Promise<DecodedAudioResult>;
  trim(inputPath: string, outputPath: string, startMs: number, endMs: number): Promise<AudioTrimResult>;
  mix(input: AudioMixInput): Promise<AudioMixResult>;
  mixProject(input: AudioMixProjectInput): Promise<AudioMixResult>;
  applyEffect(input: AudioEffectInput): Promise<AudioEffectResult>;
  compress(input: AudioCompressionInput): Promise<AudioCompressionResult>;
  synthesizePiper(input: PiperSynthesizeInput): Promise<PiperSynthesizeResult>;
};

export const AudioEditorNative = requireOptionalNativeModule<AudioEditorNativeModuleType>('AudioEditorNative');

export function assertAudioEditorNative(): AudioEditorNativeModuleType {
  if (!AudioEditorNative) {
    throw new Error('Audio Editor native module is not available in this build. Rebuild the development or production app after adding the native module.');
  }
  return AudioEditorNative;
}
