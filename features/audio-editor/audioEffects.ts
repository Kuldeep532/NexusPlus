export type AudioEffectClip = {
  id: string;
  name: string;
  uri: string;
  startMs: number;
  endMs: number;
  volume: number;
};

export function validateEffectClip(clip: AudioEffectClip): void {
  if (!clip.uri) throw new Error('Sound effect audio file is required.');
  if (!Number.isFinite(clip.startMs) || clip.startMs < 0) throw new Error('Sound effect start time is invalid.');
  if (!Number.isFinite(clip.endMs) || clip.endMs <= clip.startMs) throw new Error('Sound effect end time is invalid.');
  if (!Number.isFinite(clip.volume) || clip.volume < 0 || clip.volume > 2) throw new Error('Sound effect volume must be between 0 and 2.');
}

export function normalizeEffectVolume(volume: number): number {
  return Math.max(0, Math.min(2, Number.isFinite(volume) ? volume : 1));
}
