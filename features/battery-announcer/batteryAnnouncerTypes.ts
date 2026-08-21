export type BatteryStatus = 'charging' | 'discharging' | 'full' | 'unknown';

export type BatteryAnnouncementSettings = {
  enabled: boolean;
  announcePercentage: boolean;
  announceStatusChanges: boolean;
  lowBatteryThreshold: number;
};

export const DEFAULT_BATTERY_ANNOUNCER_SETTINGS: BatteryAnnouncementSettings = {
  enabled: true,
  announcePercentage: true,
  announceStatusChanges: true,
  lowBatteryThreshold: 20,
};
