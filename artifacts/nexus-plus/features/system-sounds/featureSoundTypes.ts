import { APP_AUDIO_ASSETS, type AppSoundId, playAppSound } from '@/lib/appSounds';

export type FeatureSoundSettings = {
  globalEnabled: boolean;
  documentProcessing: boolean;
  notifications: boolean;
  timeAnnouncement: boolean;
  battery: boolean;
  pageFlip: boolean;
  selfieShutter: boolean;
  fullCharge: boolean;
};

export const DEFAULT_FEATURE_SOUND_SETTINGS: FeatureSoundSettings = {
  globalEnabled: true,
  documentProcessing: true,
  notifications: true,
  timeAnnouncement: true,
  battery: true,
  pageFlip: true,
  selfieShutter: true,
  fullCharge: true,
};

export const FEATURE_SOUND_IDS: Record<keyof Omit<FeatureSoundSettings, 'globalEnabled'>, AppSoundId> = {
  documentProcessing: 'documentProcessing',
  notifications: 'notification',
  timeAnnouncement: 'timeAnnouncement',
  battery: 'lowBattery',
  pageFlip: 'pageFlip',
  selfieShutter: 'selfieShutter',
  fullCharge: 'fullCharge',
};

export function playFeatureSound(settings: FeatureSoundSettings, feature: keyof typeof FEATURE_SOUND_IDS, volume = 1): void {
  if (!settings.globalEnabled || !settings[feature]) return;
  playAppSound(FEATURE_SOUND_IDS[feature], volume);
}

export { APP_AUDIO_ASSETS };
