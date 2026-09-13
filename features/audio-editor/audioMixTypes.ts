import type { AudioEditorSource } from './types';

export interface AudioMixTrack {
  id: string;
  source: AudioEditorSource;
  startMs: number;
  volume: number;
  muted: boolean;
}

export interface AudioMixProject {
  base: AudioMixTrack;
  overlays: AudioMixTrack[];
}

export function createAudioMixTrack(source: AudioEditorSource, index = 0): AudioMixTrack {
  return {
    id: `${source.id}:mix:${index}`,
    source,
    startMs: 0,
    volume: 1,
    muted: false,
  };
}
