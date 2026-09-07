import type { MediaItemModel } from '@/media-player/types';

export type VideoTranscript = {
  mediaId: string;
  title: string;
  text: string;
  language?: string;
};

/**
 * Transcript-first contract for Video -> Assistant.
 * This deliberately does not upload or pass the original video binary to the
 * text model. A native/cloud transcription adapter can implement the media
 * extraction step later without changing Assistant routing.
 */
export interface VideoTranscriptionAdapter {
  isAvailable(): Promise<boolean>;
  transcribe(media: MediaItemModel): Promise<VideoTranscript>;
}

class UnavailableVideoTranscriptionAdapter implements VideoTranscriptionAdapter {
  async isAvailable(): Promise<boolean> {
    return false;
  }

  async transcribe(): Promise<VideoTranscript> {
    throw new Error('VIDEO_TRANSCRIPTION_UNAVAILABLE');
  }
}

export const videoTranscriptionAdapter: VideoTranscriptionAdapter = new UnavailableVideoTranscriptionAdapter();

export async function transcribeVideoForAssistant(media: MediaItemModel): Promise<VideoTranscript> {
  if (media.kind !== 'video') throw new Error('MEDIA_IS_NOT_VIDEO');
  if (!(await videoTranscriptionAdapter.isAvailable())) throw new Error('VIDEO_TRANSCRIPTION_UNAVAILABLE');
  const transcript = await videoTranscriptionAdapter.transcribe(media);
  if (!transcript.text.trim()) throw new Error('VIDEO_TRANSCRIPT_EMPTY');
  return { ...transcript, mediaId: media.id, title: transcript.title || media.title };
}
