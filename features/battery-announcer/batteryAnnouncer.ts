import * as Battery from 'expo-battery';
import type { BatteryStatus } from './batteryAnnouncerTypes';

export function getBatteryStatus(state: Battery.BatteryState): BatteryStatus {
  if (state === Battery.BatteryState.CHARGING) return 'charging';
  if (state === Battery.BatteryState.FULL) return 'full';
  if (state === Battery.BatteryState.UNPLUGGED) return 'discharging';
  return 'unknown';
}

export function getBatteryPhrase(level: number, status: BatteryStatus, language: 'en-IN' | 'hi-IN' = 'en-IN'): string {
  const percentage = Math.round(level * 100);
  if (language === 'hi-IN') {
    if (status === 'charging') return `बैटरी ${percentage} प्रतिशत है और फोन चार्ज हो रहा है।`;
    if (status === 'full') return `बैटरी ${percentage} प्रतिशत है और बैटरी पूरी तरह चार्ज है।`;
    if (status === 'discharging') return `बैटरी ${percentage} प्रतिशत है और फोन डिस्चार्ज हो रहा है।`;
    return `बैटरी ${percentage} प्रतिशत है।`;
  }
  if (status === 'charging') return `Battery is ${percentage} percent and the phone is charging.`;
  if (status === 'full') return `Battery is ${percentage} percent and fully charged.`;
  if (status === 'discharging') return `Battery is ${percentage} percent and the phone is discharging.`;
  return `Battery is ${percentage} percent.`;
}

export async function readCurrentBattery(language: 'en-IN' | 'hi-IN', speak: (text: string, language: 'en-IN' | 'hi-IN') => Promise<void>): Promise<void> {
  const [level, state] = await Promise.all([Battery.getBatteryLevelAsync(), Battery.getBatteryStateAsync()]);
  await speak(getBatteryPhrase(level, getBatteryStatus(state), language), language);
}
