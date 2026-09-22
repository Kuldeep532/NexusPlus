export type StreamProtocol = 'hls' | 'http' | 'https' | 'unsupported';

export type StreamResolution = {
  protocol: StreamProtocol;
  uri: string;
  mimeType?: string;
};

const HLS_EXTENSIONS = /\.m3u8(?:\?|#|$)/i;
const DIRECT_AUDIO = /\.(mp3|wav|aac|m4a|flac|ogg|opus)(?:\?|#|$)/i;
const DIRECT_VIDEO = /\.(mp4|webm|mov|m4v|mkv|3gp)(?:\?|#|$)/i;

export function resolveStream(uri: string): StreamResolution | null {
  const value = uri.trim();
  if (!/^https?:\/\//i.test(value)) return null;
  if (HLS_EXTENSIONS.test(value)) return { protocol: 'hls', uri: value, mimeType: 'application/vnd.apple.mpegurl' };
  if (DIRECT_AUDIO.test(value)) return { protocol: 'https', uri: value, mimeType: 'audio/*' };
  if (DIRECT_VIDEO.test(value)) return { protocol: 'https', uri: value, mimeType: 'video/*' };
  return { protocol: 'https', uri: value };
}

export const UNSUPPORTED_AUDIO_MESSAGE = 'This audio URL is not supported.';
export const UNSUPPORTED_VIDEO_MESSAGE = 'This video URL is not supported.';
