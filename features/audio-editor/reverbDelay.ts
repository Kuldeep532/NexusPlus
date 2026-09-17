import { assertAudioEditorNative } from '@/modules/audio-editor-native';

export type ReverbDelayPreset = 'small-room' | 'hall' | 'cave' | 'canyon';
export type ReverbDelayResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string;
};

export const REVERB_DELAY_PRESETS: ReadonlyArray<{
  id: ReverbDelayPreset;
  title: string;
  description: string;
}> = [
  { id: 'small-room', title: 'Small Room', description: 'Short, tight reflections.' },
  { id: 'hall', title: 'Hall', description: 'Spacious reflections and a smooth decay.' },
  { id: 'cave', title: 'Cave', description: 'Dense, dark reflections with long decay.' },
  { id: 'canyon', title: 'Canyon', description: 'Wide, long echoes for an open space.' },
];

export function normalizeReverbDelayAmount(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0.7));
}

export async function applyReverbDelay(
  inputPath: string,
  outputPath: string,
  preset: ReverbDelayPreset,
  amount = 0.7,
): Promise<ReverbDelayResult> {
  if (!inputPath) throw new Error('Input audio path is required.');
  if (!outputPath) throw new Error('Output audio path is required.');
  if (!REVERB_DELAY_PRESETS.some((item) => item.id === preset)) throw new Error(`Unsupported reverb preset: ${preset}.`);
  return assertAudioEditorNative().audioEffectAdvanced(
    inputPath,
    outputPath,
    'reverb-delay',
    preset,
    normalizeReverbDelayAmount(amount),
    140,
    0.45,
  );
}
