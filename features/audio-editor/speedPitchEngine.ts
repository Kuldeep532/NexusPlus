import { assertAudioEditorNative } from '@/modules/audio-editor-native';

export type SpeedPitchSettings = {
  speed: number;
  pitchSemitones: number;
};

export type SpeedPitchResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string | null;
  speed: number;
  pitchSemitones: number;
};

export function normalizeSpeedPitchSettings(settings: SpeedPitchSettings): SpeedPitchSettings {
  return {
    speed: Math.min(2, Math.max(0.5, Number.isFinite(settings.speed) ? settings.speed : 1)),
    pitchSemitones: Math.min(8, Math.max(-8, Number.isFinite(settings.pitchSemitones) ? settings.pitchSemitones : 0)),
  };
}

export async function processSpeedAndPitch(
  inputPath: string,
  outputPath: string,
  settings: SpeedPitchSettings,
): Promise<SpeedPitchResult> {
  if (!inputPath) throw new Error('Input audio path is required.');
  if (!outputPath) throw new Error('Output audio path is required.');
  const normalized = normalizeSpeedPitchSettings(settings);
  const result = await assertAudioEditorNative().speedAndPitch(
    inputPath,
    outputPath,
    normalized.speed,
    normalized.pitchSemitones,
  );
  return { ...result, speed: normalized.speed, pitchSemitones: normalized.pitchSemitones };
}
