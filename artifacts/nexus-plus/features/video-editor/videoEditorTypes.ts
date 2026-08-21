export type VideoEditorToolKey =
  | 'trim'
  | 'split'
  | 'merge'
  | 'silence-remover'
  | 'speed'
  | 'crop'
  | 'rotate'
  | 'flip'
  | 'audio'
  | 'text'
  | 'subtitles'
  | 'filters'
  | 'adjust'
  | 'watermark'
  | 'freeze-frame'
  | 'reverse'
  | 'extract-audio'
  | 'voiceover';

export type VideoClip = {
  id: string;
  uri: string;
  name: string;
  durationMs: number;
  startMs: number;
  endMs: number;
};

export type VideoProject = {
  id: string;
  name: string;
  clips: VideoClip[];
  createdAt: number;
  updatedAt: number;
};

export type TimelineOperation =
  | { type: 'trim'; clipId: string; startMs: number; endMs: number }
  | { type: 'split'; clipId: string; atMs: number }
  | { type: 'merge'; clipIds: string[] }
  | { type: 'delete'; clipId: string }
  | { type: 'reorder'; clipId: string; toIndex: number };
