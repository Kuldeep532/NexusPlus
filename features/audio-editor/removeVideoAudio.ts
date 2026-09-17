import { assertAudioEditorNative, type RemoveVideoAudioResult } from '@/modules/audio-editor-native';

export async function removeAudioFromVideo(inputPath: string, outputPath: string): Promise<RemoveVideoAudioResult> {
  if (!inputPath) throw new Error('A video file is required.');
  if (!outputPath) throw new Error('A destination video path is required.');
  return assertAudioEditorNative().removeVideoAudio(inputPath, outputPath);
}
