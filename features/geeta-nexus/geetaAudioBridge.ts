import type { GitaAudioTrack } from './geetaTypes';

export interface SharedMediaPlaybackRequest {
  source: 'geeta-nexus';
  track: GitaAudioTrack;
}

export function buildGeetaMediaPlaybackRequest(track: GitaAudioTrack): SharedMediaPlaybackRequest {
  return { source: 'geeta-nexus', track };
}
