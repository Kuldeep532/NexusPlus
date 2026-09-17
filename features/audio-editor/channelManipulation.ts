import { assertAudioEditorNative } from '@/modules/audio-editor-native';

export type ChannelMode = 'mono' | 'stereo' | 'swap' | 'left' | 'right';

export type ChannelManipulationResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string;
  mode: ChannelMode;
};

export async function manipulateChannels(inputPath: string, outputPath: string, mode: ChannelMode): Promise<ChannelManipulationResult> {
  if (!inputPath) throw new Error('Input audio path is required.');
  if (!outputPath) throw new Error('Output audio path is required.');
  if (!['mono', 'stereo', 'swap', 'left', 'right'].includes(mode)) throw new Error('Unsupported channel mode.');
  return assertAudioEditorNative().channelManipulation(inputPath, outputPath, mode);
}
