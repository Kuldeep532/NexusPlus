import { useAudioPlayer } from 'expo-audio';

export const TIME_ANNOUNCEMENT_BEEP_ASSET = require('../../assets/audio/time_assisted_beep.mp3');

let player: ReturnType<typeof useAudioPlayer> | null = null;

export function registerTimeAnnouncementBeepPlayer(nextPlayer: ReturnType<typeof useAudioPlayer>): void {
  player = nextPlayer;
}

export function playTimeAnnouncementBeep(): void {
  try {
    player?.seekTo(0);
    player?.play();
  } catch {
    // The spoken announcement should still proceed when the optional cue cannot play.
  }
}
