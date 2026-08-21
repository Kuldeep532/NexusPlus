import { createAudioPlayer } from 'expo-audio';

export const APP_AUDIO_ASSETS = {
  documentProcessing: require('../../assets/audio/document_processing.mp3'),
  notification: require('../../assets/audio/notification.mp3'),
  lowBattery: require('../../assets/audio/low_battery.mp3'),
  timeAnnouncement: require('../../assets/audio/time_assisted_beep.mp3'),
  pageFlip: require('../../assets/audio/pageflip.mp3'),
  selfieShutter: require('../../assets/audio/selfie_shutter_nexus_01.mp3'),
  fullCharge: require('../../assets/audio/full_charge.mp3'),
} as const;

export type AppSoundId = keyof typeof APP_AUDIO_ASSETS;

export function playAppSound(sound: AppSoundId, volume = 1): void {
  try {
    const player = createAudioPlayer(APP_AUDIO_ASSETS[sound]);
    player.volume = volume;
    player.play();
  } catch {
    // A sound cue is auxiliary and must never break the primary feature flow.
  }
}
