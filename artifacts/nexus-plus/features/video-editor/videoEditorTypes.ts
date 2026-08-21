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
  | 'voiceover'
  | 'transitions'
  | 'overlay'
  | 'keyframes'
  | 'chroma-key'
  | 'denoise'
  | 'stabilize'
  | 'equalizer'
  | 'loudness'
  | 'speed-ramp'
  | 'frame-interpolation'
  | 'letterbox';

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
  | { type: 'reorder'; clipId: string; toIndex: number }
  | { type: 'speed'; clipId: string; rate: number }
  | { type: 'rotate'; clipId: string; degrees: 90 | 180 | 270 }
  | { type: 'flip'; clipId: string; horizontal: boolean; vertical: boolean }
  | { type: 'crop'; clipId: string; aspectRatio: string; x: number; y: number; width: number; height: number }
  | { type: 'freeze-frame'; clipId: string; atMs: number; durationMs: number }
  | { type: 'reverse'; clipId: string }
  | { type: 'extract-audio'; clipId: string }
  | { type: 'transition'; fromClipId: string; toClipId: string; kind: string; durationMs: number }
  | { type: 'overlay'; clipId: string; assetUri: string; startMs: number; endMs: number }
  | { type: 'keyframe'; clipId: string; property: string; atMs: number; value: number }
  | { type: 'chroma-key'; clipId: string; colorHex: string; threshold: number; softness: number }
  | { type: 'denoise'; clipId: string; strength: number }
  | { type: 'stabilize'; clipId: string; strength: number }
  | { type: 'equalizer'; clipId: string; bands: Record<string, number> }
  | { type: 'loudness'; clipId: string; targetLufs: number }
  | { type: 'letterbox'; clipId: string; aspectRatio: string };
