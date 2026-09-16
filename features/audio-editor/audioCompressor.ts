import { assertAudioEditorNative } from '@/modules/audio-editor-native';

export type AudioCompressionPreset = {
  id: string;
  title: string;
  description: string;
  bitrate: number;
  sampleRate: number;
};

export const AUDIO_COMPRESSION_PRESETS: AudioCompressionPreset[] = [
  { id: 'voice-small', title: 'Voice — Small', description: 'Small file for speech and voice notes.', bitrate: 48000, sampleRate: 22050 },
  { id: 'voice-balanced', title: 'Voice — Balanced', description: 'Balanced speech quality and file size.', bitrate: 64000, sampleRate: 32000 },
  { id: 'music-small', title: 'Music — Small', description: 'Reduced music file size with audible quality preserved.', bitrate: 96000, sampleRate: 44100 },
  { id: 'music-balanced', title: 'Music — Balanced', description: 'Balanced music quality and size.', bitrate: 128000, sampleRate: 44100 },
];

export type CompressAudioInput = {
  inputPath: string;
  outputPath: string;
  bitrate: number;
  sampleRate: number;
};

export type CompressAudioResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  bitrate: number;
  mimeType: string | null;
  inputBytes?: number;
  outputBytes?: number;
};

export async function compressAudio(input: CompressAudioInput): Promise<CompressAudioResult> {
  if (!input.inputPath) throw new Error('Input audio path is required.');
  if (!input.outputPath) throw new Error('Output audio path is required.');
  if (!Number.isFinite(input.bitrate) || input.bitrate < 8000 || input.bitrate > 512000) throw new Error('Bitrate must be between 8 kbps and 512 kbps.');
  if (!Number.isFinite(input.sampleRate) || input.sampleRate < 8000 || input.sampleRate > 96000) throw new Error('Sample rate must be between 8 kHz and 96 kHz.');
  return assertAudioEditorNative().compress(input.inputPath, input.outputPath, input.bitrate, input.sampleRate);
}
