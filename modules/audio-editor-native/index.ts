import { requireOptionalNativeModule } from 'expo-modules-core';

export type AudioProbeResult = {
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string | null;
};

export type AudioTrimResult = {
  outputPath: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  mimeType: string | null;
  samples?: number;
};

type AudioEditorNativeModuleType = {
  probe(inputPath: string): Promise<AudioProbeResult>;
  trim(inputPath: string, outputPath: string, startMs: number, endMs: number): Promise<AudioTrimResult>;
};

export const AudioEditorNative = requireOptionalNativeModule<AudioEditorNativeModuleType>('AudioEditorNative');

export function assertAudioEditorNative(): AudioEditorNativeModuleType {
  if (!AudioEditorNative) {
    throw new Error('Audio Editor native module is not available in this build. Rebuild the development or production app after adding the native module.');
  }
  return AudioEditorNative;
}
