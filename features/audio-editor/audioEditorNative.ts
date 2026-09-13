import { requireOptionalNativeModule } from 'expo-modules-core';

export interface AudioProbeResult {
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType?: string | null;
}

interface AudioEditorNativeApi {
  probe(inputPath: string): Promise<AudioProbeResult>;
  trim(inputPath: string, outputPath: string, startMs: number, endMs: number): Promise<void>;
}

const nativeModule = requireOptionalNativeModule<AudioEditorNativeApi>('AudioEditorNative');

export function getAudioEditorNativeModule(): AudioEditorNativeApi | null {
  return nativeModule;
}

export async function probeAudio(inputPath: string): Promise<AudioProbeResult> {
  if (!nativeModule) {
    throw new Error('Audio Editor native module is not available in this build.');
  }
  return nativeModule.probe(inputPath);
}
