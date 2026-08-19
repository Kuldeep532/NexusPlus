export type MediaKind = 'audio' | 'video';
export type RepeatMode = 'off' | 'one' | 'all';

export interface SubtitleCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language?: string;
  uri?: string;
  cues?: SubtitleCue[];
}

export interface MediaItemModel {
  id: string;
  uri: string;
  kind: MediaKind;
  title: string;
  artist?: string;
  album?: string;
  durationMs?: number;
  artworkUri?: string;
  subtitleTracks?: SubtitleTrack[];
  isLocal?: boolean;
  mimeType?: string;
  width?: number;
  height?: number;
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
  selectedSubtitleId?: string;
  error?: string;
}

export interface MediaLibraryState {
  permissionGranted: boolean;
  loading: boolean;
  audio: MediaItemModel[];
  video: MediaItemModel[];
  error?: string;
}

export interface LocalMediaAi {
  transcribe(uri: string): Promise<string>;
  summarize(text: string): Promise<string>;
  extractChapters(text: string): Promise<Array<{ title: string; startMs: number }>>;
  suggestTags(metadata: Pick<MediaItemModel, 'title' | 'artist' | 'album'>): Promise<string[]>;
}
