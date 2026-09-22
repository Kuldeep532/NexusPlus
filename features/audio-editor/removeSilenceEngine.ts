import { assertAudioEditorNative } from '@/modules/audio-editor-native';

export type RemoveSilenceSettings = {
  thresholdDb: number;
  minSilenceMs: number;
  paddingMs: number;
};

export type RemoveSilenceResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string | null;
  removedSilenceMs: number;
};

export const DEFAULT_REMOVE_SILENCE_SETTINGS: RemoveSilenceSettings = {
  thresholdDb: -40,
  minSilenceMs: 350,
  paddingMs: 80,
};

export function normalizeRemoveSilenceSettings(settings: RemoveSilenceSettings): RemoveSilenceSettings {
  return {
    thresholdDb: Math.max(-70, Math.min(-12, Number.isFinite(settings.thresholdDb) ? settings.thresholdDb : DEFAULT_REMOVE_SILENCE_SETTINGS.thresholdDb)),
    minSilenceMs: Math.max(50, Math.min(3000, Number.isFinite(settings.minSilenceMs) ? settings.minSilenceMs : DEFAULT_REMOVE_SILENCE_SETTINGS.minSilenceMs)),
    paddingMs: Math.max(0, Math.min(500, Number.isFinite(settings.paddingMs) ? settings.paddingMs : DEFAULT_REMOVE_SILENCE_SETTINGS.paddingMs)),
  };
}

export async function processRemoveSilence(
  inputPath: string,
  outputPath: string,
  settings: RemoveSilenceSettings = DEFAULT_REMOVE_SILENCE_SETTINGS,
): Promise<RemoveSilenceResult> {
  const native = assertAudioEditorNative();
  return native.removeSilence(inputPath, outputPath, normalizeRemoveSilenceSettings(settings));
}
