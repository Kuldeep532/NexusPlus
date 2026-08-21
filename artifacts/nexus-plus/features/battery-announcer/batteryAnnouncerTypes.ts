import type { FeatureSoundSettings } from '@/features/system-sounds/featureSoundTypes';

export type BatteryAnnouncementSettings = {
  enabled: boolean;
  announcePercentage: boolean;
  announceStatusChanges: boolean;
  announceAtInterval: boolean;
  announcementIntervalMinutes: 30 | 60 | 120;
  announcementThreshold: number;
  lowBatteryThreshold: number;
  soundEnabled: boolean;
  fullChargeSoundEnabled: boolean;
};

export const DEFAULT_BATTERY_ANNOUNCER_SETTINGS: BatteryAnnouncementSettings = {
  enabled: true,
  announcePercentage: true,
  announceStatusChanges: true,
  announceAtInterval: false,
  announcementIntervalMinutes: 60,
  announcementThreshold: 20,
  lowBatteryThreshold: 20,
  soundEnabled: true,
  fullChargeSoundEnabled: true,
};
