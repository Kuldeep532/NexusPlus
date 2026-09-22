import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeColor = 'ocean-blue' | 'classic' | 'light' | 'dark' | 'system' | 'material' | 'black' | 'spiritual';

const STORAGE_KEY = 'nexus-plus.theme-color.v2';
export const DEFAULT_THEME_COLOR: ThemeColor = 'ocean-blue';

const VALID: ThemeColor[] = ['ocean-blue','classic','light','dark','system','material','black','spiritual'];

export async function readThemeColor(): Promise<ThemeColor> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw && VALID.includes(raw as ThemeColor) ? raw as ThemeColor : DEFAULT_THEME_COLOR;
  } catch {
    return DEFAULT_THEME_COLOR;
  }
}

export async function writeThemeColor(theme: ThemeColor): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, theme);
}
