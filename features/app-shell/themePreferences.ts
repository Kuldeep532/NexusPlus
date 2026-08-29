import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeColor = 'ocean-blue' | 'classic' | 'light' | 'dark' | 'system';

const STORAGE_KEY = 'nexus-plus.theme-color.v1';

export const DEFAULT_THEME_COLOR: ThemeColor = 'ocean-blue';

export async function readThemeColor(): Promise<ThemeColor> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === 'classic' || raw === 'light' || raw === 'dark' || raw === 'system' || raw === 'ocean-blue') return raw;
  return DEFAULT_THEME_COLOR;
}

export async function writeThemeColor(theme: ThemeColor): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, theme);
}
