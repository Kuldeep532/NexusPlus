import { requireOptionalNativeModule } from 'expo-modules-core';

export type AudioProbeResult = { durationMs: number; sampleRate: number; channels: number; mimeType: string | null };
export type DecodedAudioResult = { sampleRate: number; channels: number; durationMs: number; samples: number[] };
export type AudioTrimResult = { outputPath: string; startMs: number; endMs: number; durationMs: number; mimeType: string | null; samples?: number };
export type AudioMixClip = { path: string; startMs: number; volume: number };
export type AudioMixInput = { inputPath: string; overlayPath: string; overlayStartMs: number; overlayVolume: number; outputPath: string };
export type AudioMixProjectInput = { basePath: string; overlays: AudioMixClip[]; outputPath: string };
export type AudioMixResult = { outputPath: string; durationMs: number; sampleRate: number; channels: number; mimeType: string | null };
export type AudioCompressResult = { outputPath: string; durationMs: number; sampleRate: number; channels: number; bitrate: number; mimeType: string | null; inputBytes?: number; outputBytes?: number };
export type VoicePitchNativeResult = { outputPath: string; durationMs: number; sampleRate: number; channels: number; mimeType: string | null };
export type PiperTtsSynthesisResult = { outputPath: string };
export type SpeedPitchNativeResult = { outputPath: string; durationMs: number; sampleRate: number; channels: number; mimeType: string | null };

type AudioEditorNativeModuleType = {
  probe(inputPath: string): Promise<AudioProbeResult>;
  decode(inputPath: string): Promise<DecodedAudioResult>;
  trim(inputPath: string, outputPath: string, startMs: number, endMs: number): Promise<AudioTrimResult>;
  mix(input: AudioMixInput): Promise<AudioMixResult>;
  mixProject(input: AudioMixProjectInput): Promise<AudioMixResult>;
  compress(inputPath: string, outputPath: string, bitrate: number, sampleRate: number): Promise<AudioCompressResult>;
  pitchShift(inputPath: string, outputPath: string, pitchSemitones: number, formantShift: number, timbre: number): Promise<VoicePitchNativeResult>;
  synthesizeTts(text: string, modelPath: string, configPath: string, outputPath: string, lengthScale: number, pitchScale: number, emotion: string, clone: boolean): Promise<PiperTtsSynthesisResult>;
  speedAndPitch(inputPath: string, outputPath: string, speed: number, pitchSemitones: number): Promise<SpeedPitchNativeResult>;
};

export const AudioEditorNative = requireOptionalNativeModule<AudioEditorNativeModuleType>('AudioEditorNative');
export function assertAudioEditorNative(): AudioEditorNativeModuleType {
  if (!AudioEditorNative) throw new Error('Audio Editor native module is not available in this build. Rebuild the development or production app after adding the native module.');
  return AudioEditorNative;
}
