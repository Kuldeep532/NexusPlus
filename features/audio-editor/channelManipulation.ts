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

const NATIVE_MODE: Record<ChannelMode, string> = {
  mono: 'channel-mono',
  stereo: 'channel-stereo',
  swap: 'channel-swap',
  left: 'channel-left',
  right: 'channel-right',
};

export async function manipulateChannels(inputPath: string, outputPath: string, mode: ChannelMode): Promise<ChannelManipulationResult> {
  if (!inputPath) throw new Error('Input audio path is required.');
  if (!outputPath) throw new Error('Output audio path is required.');
  if (!(mode in NATIVE_MODE)) throw new Error('Unsupported channel mode.');
  const result = await assertAudioEditorNative().audioEffect(inputPath, outputPath, NATIVE_MODE[mode], 1);
  return { ...result, mode };
}
