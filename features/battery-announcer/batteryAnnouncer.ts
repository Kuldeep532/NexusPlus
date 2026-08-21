import * as Battery from 'expo-battery';
import type { BatteryAnnouncementSettings, BatteryStatus } from './batteryAnnouncerTypes';

export function getBatteryStatus(state: Battery.BatteryState): BatteryStatus {
  if (state === Battery.BatteryState.CHARGING) return 'charging';
  if (state === Battery.BatteryState.FULL) return 'full';
  if (state === Battery.BatteryState.UNPLUGGED) return 'discharging';
  return 'unknown';
}

export function getBatteryPhrase(
  level: number,
  status: BatteryStatus,
  language: 'en-IN' | 'hi-IN' = 'en-IN',
  settings?: Pick<BatteryAnnouncementSettings, 'announcePercentage' | 'lowBatteryThreshold'>,
): string {
  const percentage = Math.round(Math.max(0, Math.min(1, level)) * 100);
  const includePercentage = settings?.announcePercentage ?? true;
  const lowThreshold = settings?.lowBatteryThreshold ?? 20;
  const prefix = includePercentage
    ? language === 'hi-IN'
      ? `बैटरी ${percentage} प्रतिशत`
      : `Battery is ${percentage} percent`
    : language === 'hi-IN'
      ? 'बैटरी'
      : 'Battery';
  const lowSuffix = percentage <= lowThreshold
    ? language === 'hi-IN'
      ? ' बैटरी कम है।'
      : ' Battery is low.'
    : '';

  if (language === 'hi-IN') {
    if (status === 'charging') return `${prefix} है और फोन चार्ज हो रहा है।${lowSuffix}`;
    if (status === 'full') return `${prefix} है और बैटरी पूरी तरह चार्ज है।`;
    if (status === 'discharging') return `${prefix} है और फोन डिस्चार्ज हो रहा है।${lowSuffix}`;
    return `${prefix} है।${lowSuffix}`;
  }
  if (status === 'charging') return `${prefix} and the phone is charging.${lowSuffix}`;
  if (status === 'full') return `${prefix} and fully charged.`;
  if (status === 'discharging') return `${prefix} and the phone is discharging.${lowSuffix}`;
  return `${prefix}.${lowSuffix}`;
}

export async function readCurrentBattery(
  language: 'en-IN' | 'hi-IN',
  speak: (text: string, language: 'en-IN' | 'hi-IN') => Promise<void>,
  settings?: Pick<BatteryAnnouncementSettings, 'announcePercentage' | 'lowBatteryThreshold'>,
): Promise<void> {
  const [level, state] = await Promise.all([Battery.getBatteryLevelAsync(), Battery.getBatteryStateAsync()]);
  await speak(getBatteryPhrase(level, getBatteryStatus(state), language, settings), language);
}
