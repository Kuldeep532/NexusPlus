export type MirrorTarget = 'tv' | 'computer';
export type MirrorMode = 'specific-app' | 'complete-screen' | 'media';
export type MediaKind = 'image' | 'video';

export type MirrorMediaItem = {
  uri: string;
  mimeType?: string;
  kind: MediaKind;
  name?: string;
  durationMs?: number;
};

export type MirrorSession = {
  id: string;
  target: MirrorTarget;
  mode: MirrorMode;
  active: boolean;
  selectedMedia?: MirrorMediaItem;
  startedAt: number;
};
