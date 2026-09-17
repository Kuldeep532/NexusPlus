import { assertAudioEditorNative } from '@/modules/audio-editor-native';

export type AudioFormat = 'mp3' | 'aac' | 'wav' | 'flac' | 'ogg' | 'm4a';

export type AudioFormatOption = {
  id: AudioFormat;
  title: string;
  extension: string;
  mimeType: string;
  description: string;
};

export const AUDIO_FORMAT_OPTIONS: AudioFormatOption[] = [
  { id: 'mp3', title: 'MP3', extension: 'mp3', mimeType: 'audio/mpeg', description: 'Widely compatible compressed audio.' },
  { id: 'aac', title: 'AAC', extension: 'aac', mimeType: 'audio/aac', description: 'Efficient lossy audio for modern devices.' },
  { id: 'wav', title: 'WAV', extension: 'wav', mimeType: 'audio/wav', description: 'Uncompressed PCM audio.' },
  { id: 'flac', title: 'FLAC', extension: 'flac', mimeType: 'audio/flac', description: 'Lossless compressed audio.' },
  { id: 'ogg', title: 'OGG', extension: 'ogg', mimeType: 'audio/ogg', description: 'Open container commonly used with Vorbis/Opus.' },
  { id: 'm4a', title: 'M4A', extension: 'm4a', mimeType: 'audio/mp4', description: 'AAC audio in an MP4/M4A container.' },
];

export type AudioFormatConversionRequest = {
  inputPath: string;
  outputPath: string;
  format: AudioFormat;
  bitrate?: number;
  sampleRate?: number;
  quality?: number;
};

export type AudioFormatConversionResult = {
  outputPath: string;
  format: AudioFormat;
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string;
  inputBytes?: number;
  outputBytes?: number;
};

export async function convertAudioFormat(
  request: AudioFormatConversionRequest,
): Promise<AudioFormatConversionResult> {
  if (!request.inputPath) throw new Error('Input audio path is required.');
  if (!request.outputPath) throw new Error('Output audio path is required.');
  if (!AUDIO_FORMAT_OPTIONS.some((item) => item.id === request.format)) {
    throw new Error(`Unsupported output format: ${request.format}.`);
  }
  if (request.bitrate !== undefined && (!Number.isFinite(request.bitrate) || request.bitrate < 8_000 || request.bitrate > 512_000)) {
    throw new Error('Bitrate must be between 8 kbps and 512 kbps.');
  }
  if (request.sampleRate !== undefined && (!Number.isFinite(request.sampleRate) || request.sampleRate < 8_000 || request.sampleRate > 192_000)) {
    throw new Error('Sample rate must be between 8 kHz and 192 kHz.');
  }
  if (request.quality !== undefined && (!Number.isFinite(request.quality) || request.quality < 0 || request.quality > 10)) {
    throw new Error('Quality must be between 0 and 10.');
  }

  return assertAudioEditorNative().convertFormat(
    request.inputPath,
    request.outputPath,
    request.format,
    request.bitrate ?? 128_000,
    request.sampleRate ?? 44_100,
    request.quality ?? 5,
  );
}
