import * as SecureStore from 'expo-secure-store';
import {
  DEFAULT_BATTERY_ANNOUNCER_SETTINGS,
  type BatteryAnnouncementSettings,
} from './batteryAnnouncerTypes';

const KEY = 'nexus-plus.battery-announcer-settings';

export async function loadBatteryAnnouncementSettings(): Promise<BatteryAnnouncementSettings> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return DEFAULT_BATTERY_ANNOUNCER_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<BatteryAnnouncementSettings>;
    return {
      enabled: parsed.enabled !== false,
      announcePercentage: parsed.announcePercentage !== false,
      announceStatusChanges: parsed.announceStatusChanges !== false,
      lowBatteryThreshold: Math.max(0, Math.min(100, Number.isFinite(parsed.lowBatteryThreshold) ? Number(parsed.lowBatteryThreshold) : 20)),
    };
  } catch {
    return DEFAULT_BATTERY_ANNOUNCER_SETTINGS;
  }
}

export async function saveBatteryAnnouncementSettings(
  settings: BatteryAnnouncementSettings,
): Promise<void> {
  const normalized: BatteryAnnouncementSettings = {
    enabled: Boolean(settings.enabled),
    announcePercentage: Boolean(settings.announcePercentage),
    announceStatusChanges: Boolean(settings.announceStatusChanges),
    lowBatteryThreshold: Math.max(0, Math.min(100, Math.round(settings.lowBatteryThreshold))),
  };
  await SecureStore.setItemAsync(KEY, JSON.stringify(normalized));
}
