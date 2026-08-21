export const AUDIO_ASSETS = {
  documentProcessing: require('../../assets/audio/document_processing.mp3'),
  notification: require('../../assets/audio/notification.mp3'),
  lowBattery: require('../../assets/audio/low_battery.mp3'),
  timeAssistedBeep: require('../../assets/audio/time_assisted_beep.mp3'),
  pageFlip: require('../../assets/audio/pageflip.mp3'),
  selfieShutter: require('../../assets/audio/selfie_shutter_nexus_01.mp3'),
  fullCharge: require('../../assets/audio/full_charge.mp3'),
} as const;

export type AudioAssetKey = keyof typeof AUDIO_ASSETS;
