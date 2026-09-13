export interface AudioEffectTimelineClip {
  id: string;
  name: string;
  uri: string;
  startMs: number;
  endMs: number;
  volume: number;
}

export function validateEffectTimelineClip(
  clip: AudioEffectTimelineClip,
  baseDurationMs: number,
): void {
  if (!clip.uri) throw new Error('Sound effect audio file is required.');
  if (!Number.isFinite(baseDurationMs) || baseDurationMs <= 0) {
    throw new Error('Base audio duration is invalid.');
  }
  if (!Number.isFinite(clip.startMs) || clip.startMs < 0) {
    throw new Error('Sound effect start time is invalid.');
  }
  if (!Number.isFinite(clip.endMs) || clip.endMs <= clip.startMs) {
    throw new Error('Sound effect end time is invalid.');
  }
  if (clip.endMs > baseDurationMs) {
    throw new Error('Sound effect exceeds the base audio duration.');
  }
  if (!Number.isFinite(clip.volume) || clip.volume < 0 || clip.volume > 2) {
    throw new Error('Sound effect volume must be between 0 and 2.');
  }
}

export function clampEffectTimelineClip(
  clip: AudioEffectTimelineClip,
  baseDurationMs: number,
): AudioEffectTimelineClip {
  const end = Math.min(Math.max(clip.endMs, 1), Math.max(baseDurationMs, 1));
  const start = Math.max(0, Math.min(clip.startMs, end - 1));
  return {
    ...clip,
    startMs: start,
    endMs: end,
    volume: Math.max(0, Math.min(2, Number.isFinite(clip.volume) ? clip.volume : 1)),
  };
}
