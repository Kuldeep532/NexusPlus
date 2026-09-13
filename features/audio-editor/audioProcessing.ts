import { assertAudioEditorNative, type AudioProbeResult, type AudioTrimResult } from '@/modules/audio-editor-native';

export async function probeAudioSource(uri: string): Promise<AudioProbeResult> {
  return assertAudioEditorNative().probe(uri);
}

export async function decodeAudioSource(uri: string) {
  return assertAudioEditorNative().decode(uri);
}

export async function trimAudioSource(
  uri: string,
  outputPath: string,
  startMs: number,
  endMs: number,
): Promise<AudioTrimResult> {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs < 0 || endMs <= startMs) {
    throw new Error('Audio trim range is invalid.');
  }
  return assertAudioEditorNative().trim(uri, outputPath, startMs, endMs);
}

export function isAudioProcessingAvailable(): boolean {
  return Boolean(require('@/modules/audio-editor-native').AudioEditorNative);
}
