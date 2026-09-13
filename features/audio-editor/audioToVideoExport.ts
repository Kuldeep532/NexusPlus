import { createAudioEditorOutputPath } from './audioEditorExport';
import type { AudioToVideoImage } from './audioToVideoTypes';
import { runNativeVideoOperation } from '@/features/video-editor/native/videoEditorNativeBridge';
import type { AudioEditorSource } from './types';

export type AudioToVideoExportInput = {
  audio: AudioEditorSource;
  images: AudioToVideoImage[];
};

export async function exportAudioToVideo({ audio, images }: AudioToVideoExportInput): Promise<string> {
  if (!audio.uri) throw new Error('Audio source is required.');
  if (images.length === 0) throw new Error('Add at least one image.');
  const totalImageDuration = images.reduce((sum, image) => sum + image.durationMs, 0);
  if (Math.abs(totalImageDuration - audio.durationMs) > 1) {
    throw new Error('Image timing must exactly cover the selected audio duration before export.');
  }

  const outputUri = await createAudioEditorOutputPath('Audio to Video', audio.name, 'mp4');
  const result = await runNativeVideoOperation({
    type: 'audio-to-video',
    audioUri: audio.uri,
    images: images.map((image) => ({ uri: image.uri, durationMs: image.durationMs })),
    outputUri,
  });
  if (!result.outputUri) throw new Error('The native video engine did not return an output file.');
  return result.outputUri;
}
