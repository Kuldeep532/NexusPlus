import { assertAudioEditorNative, type AudioCompressionResult } from '@/modules/audio-editor-native';

export type AudioCompressionPreset = {
  id: 'compact' | 'balanced' | 'quality';
  title: string;
  description: string;
  bitrateKbps: number;
  sampleRateHz: number;
};

export const AUDIO_COMPRESSION_PRESETS: AudioCompressionPreset[] = [
  {
    id: 'compact',
    title: 'Small file',
    description: 'Prioritize a smaller file for sharing and storage.',
    bitrateKbps: 64,
    sampleRateHz: 22050,
  },
  {
    id: 'balanced',
    title: 'Balanced',
    description: 'Good quality with a meaningful reduction in file size.',
    bitrateKbps: 128,
    sampleRateHz: 44100,
  },
  {
    id: 'quality',
    title: 'Quality',
    description: 'Keep more detail while still using efficient AAC encoding.',
    bitrateKbps: 192,
    sampleRateHz: 48000,
  },
];

export async function compressAudioSource(
  inputPath: string,
  outputPath: string,
  preset: AudioCompressionPreset,
): Promise<AudioCompressionResult> {
  if (!inputPath.trim()) throw new Error('Select an audio file first.');
  if (!outputPath.trim()) throw new Error('A compression output path is required.');
  if (!AUDIO_COMPRESSION_PRESETS.some((item) => item.id === preset.id)) {
    throw new Error('The selected compression preset is not supported.');
  }

  const result = await assertAudioEditorNative().compress({
    inputPath,
    outputPath,
    bitrateKbps: preset.bitrateKbps,
    sampleRateHz: preset.sampleRateHz,
  });

  if (!result.outputPath) throw new Error('Audio compression did not return an output file.');
  return result;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
