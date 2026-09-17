import { assertAudioEditorNative } from '@/modules/audio-editor-native';

export type ReverbDelayPreset = 'small-room' | 'hall' | 'cave' | 'canyon';

export type ReverbDelaySettings = {
  preset: ReverbDelayPreset;
  amount: number;
  delayMs: number;
  feedback: number;
};

export type ReverbDelayResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string | null;
};

export const REVERB_DELAY_PRESETS: ReadonlyArray<{ id: ReverbDelayPreset; name: string; description: string }> = [
  { id: 'small-room', name: 'Small Room', description: 'Short early reflections for an intimate room sound.' },
  { id: 'hall', name: 'Hall', description: 'Longer, smoother reflections for a concert-hall feel.' },
  { id: 'cave', name: 'Cave', description: 'Deep reflections with a darker, longer tail.' },
  { id: 'canyon', name: 'Canyon', description: 'Very long spaced reflections for a wide outdoor echo.' },
];

export function normalizeReverbDelaySettings(settings: ReverbDelaySettings): ReverbDelaySettings {
  return {
    preset: settings.preset,
    amount: Math.min(1, Math.max(0, Number.isFinite(settings.amount) ? settings.amount : 0.7)),
    delayMs: Math.min(1200, Math.max(1, Number.isFinite(settings.delayMs) ? settings.delayMs : 220)),
    feedback: Math.min(0.9, Math.max(0, Number.isFinite(settings.feedback) ? settings.feedback : 0.35)),
  };
}

export async function processReverbDelay(
  inputPath: string,
  outputPath: string,
  settings: ReverbDelaySettings,
): Promise<ReverbDelayResult> {
  if (!inputPath) throw new Error('Input audio path is required.');
  if (!outputPath) throw new Error('Output audio path is required.');
  const normalized = normalizeReverbDelaySettings(settings);
  return assertAudioEditorNative().audioEffectAdvanced(
    inputPath,
    outputPath,
    'reverb-delay',
    normalized.preset,
    normalized.amount,
    normalized.delayMs,
    normalized.feedback,
  );
}
