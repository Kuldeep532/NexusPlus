import { assertAudioEditorNative } from '@/modules/audio-editor-native';

export type AudioNormalizationTarget = 0.7 | 0.85 | 0.95;

export type AudioNormalizationResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string | null;
  target: AudioNormalizationTarget;
};

export async function normalizeAudio(
  inputPath: string,
  outputPath: string,
  target: AudioNormalizationTarget,
): Promise<AudioNormalizationResult> {
  if (!inputPath) throw new Error('Input audio path is required.');
  if (!outputPath) throw new Error('Output audio path is required.');
  if (![0.7, 0.85, 0.95].includes(target)) throw new Error('Unsupported normalization target.');

  const result = await assertAudioEditorNative().applyEffect({
    inputPath,
    outputPath,
    effect: 'normalize',
    amount: target,
  });
  return { ...result, target };
}
