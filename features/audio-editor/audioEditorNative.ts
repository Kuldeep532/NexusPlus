import { requireOptionalNativeModule } from 'expo-modules-core';

export interface AudioProbeResult { durationMs: number; sampleRate: number; channels: number; mimeType?: string | null; }
export interface AudioTrimResult { outputPath: string; startMs: number; endMs: number; durationMs: number; mimeType?: string | null; samples?: number; }
export interface AudioFormatConversionResult { outputPath: string; format: string; durationMs: number; sampleRate: number; channels: number; mimeType: string; inputBytes?: number; outputBytes?: number; }
interface AudioEditorNativeApi {
  probe(inputPath: string): Promise<AudioProbeResult>;
  trim(inputPath: string, outputPath: string, startMs: number, endMs: number): Promise<AudioTrimResult>;
  convertFormat(inputPath: string, outputPath: string, format: string, bitrate: number, sampleRate: number, quality: number): Promise<AudioFormatConversionResult>;
}
const nativeModule = requireOptionalNativeModule<AudioEditorNativeApi>('AudioEditorNative');
export function getAudioEditorNativeModule(): AudioEditorNativeApi | null { return nativeModule; }
export function assertAudioEditorNative(): AudioEditorNativeApi { if (!nativeModule) throw new Error('Audio Editor native module is not available in this build. Rebuild the development or production app after adding the native module.'); return nativeModule; }
export async function probeAudio(inputPath: string): Promise<AudioProbeResult> { return assertAudioEditorNative().probe(inputPath); }
