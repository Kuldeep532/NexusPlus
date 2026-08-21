import { createAudioPlayer } from 'expo-audio';

const TIME_BEEP_ASSET = require('../../assets/audio/time_assisted_beep.mp3');
let player: ReturnType<typeof createAudioPlayer> | null = null;
let soundEnabled = true;

export const TIME_ANNOUNCEMENT_BEEP_ASSET = TIME_BEEP_ASSET;

export function registerTimeAnnouncementBeepPlayer(nextPlayer: ReturnType<typeof createAudioPlayer>): void {
  player = nextPlayer;
}

export function setTimeAnnouncementSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function playTimeAnnouncementBeep(): void {
  if (!soundEnabled) return;
  try {
    if (!player) player = createAudioPlayer(TIME_BEEP_ASSET);
    player.seekTo(0);
    player.play();
  } catch {
    // The spoken announcement should still proceed when the optional cue cannot play.
  }
}
