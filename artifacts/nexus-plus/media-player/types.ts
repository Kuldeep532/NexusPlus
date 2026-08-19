export type MediaKind = 'audio' | 'video';
export type RepeatMode = 'off' | 'one' | 'all';

export interface SubtitleCue {
  startMs: number;
  endMs: number;
  text: string;
}

export interface MediaItemModel {
  id: string;
  uri: string;
  title: string;
  artist?: string;
  album?: string;
  artworkUri?: string;
  durationMs?: number;
  kind: MediaKind;
  subtitles?: SubtitleCue[];
}

export interface PlayerState {
  current: MediaItemModel | null;
  queue: MediaItemModel[];
  index: number;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  bufferedMs: number;
  rate: number;
  volume: number;
  repeat: RepeatMode;
  shuffle: boolean;
}
