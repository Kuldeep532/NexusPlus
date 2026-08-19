import * as Battery from 'expo-battery';
import type { BatteryStatus } from './batteryAnnouncerTypes';
import type { FeatureTtsLanguage } from '../language-preferences/languagePreferences';

export function getBatteryStatus(state: Battery.BatteryState): BatteryStatus {
  switch (state) {
    case Battery.BatteryState.CHARGING:
      return 'charging';
    case Battery.BatteryState.FULL:
      return 'full';
    case Battery.BatteryState.UNPLUGGED:
      return 'discharging';
    default:
      return 'unknown';
  }
}

export function getBatteryPhrase(
  percentage: number,
  status: BatteryStatus,
  language: FeatureTtsLanguage,
): string {
  const value = Math.round(percentage * 100);
  if (language === 'hi-IN') {
    if (status === 'charging') return `बैटरी ${value} प्रतिशत है और फोन चार्ज हो रहा है।`;
    if (status === 'full') return `बैटरी ${value} प्रतिशत है और पूरी तरह चार्ज है।`;
    if (status === 'discharging') return `बैटरी ${value} प्रतिशत है और फोन डिस्चार्ज हो रहा है।`;
    return `बैटरी ${value} प्रतिशत है।`;
  }
  if (status === 'charging') return `Battery is at ${value} percent and the phone is charging.`;
  if (status === 'full') return `Battery is at ${value} percent and fully charged.`;
  if (status === 'discharging') return `Battery is at ${value} percent and the phone is discharging.`;
  return `Battery is at ${value} percent.`;
}

export async function readCurrentBattery(language: FeatureTtsLanguage, speak: (text: string, language: FeatureTtsLanguage) => Promise<void>) {
  const [level, state] = await Promise.all([Battery.getBatteryLevelAsync(), Battery.getBatteryStateAsync()]);
  await speak(getBatteryPhrase(level, getBatteryStatus(state), language), language);
}
