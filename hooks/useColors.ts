import { useColorScheme } from 'react-native';
import { useSyncExternalStore } from 'react';
import { readThemeColor, type ThemeColor } from '@/features/app-shell/themePreferences';
import { palettes, radius, type ColorTokens } from '@/constants/colors';

let selectedTheme: ThemeColor = 'ocean-blue';
let loaded = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() { return selectedTheme; }
function getServerSnapshot() { return 'ocean-blue' as ThemeColor; }

export function refreshThemeColor(theme: ThemeColor) {
  selectedTheme = theme;
  loaded = true;
  listeners.forEach((listener) => listener());
}

export function useColors(): ColorTokens & { radius: number } {
  const scheme = useColorScheme();
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!loaded) {
    void readThemeColor().then(refreshThemeColor);
  }

  const paletteName = theme === 'ocean-blue' ? 'oceanBlue' : theme === 'classic' ? 'classic' : 'light';
  const palette = palettes[paletteName];
  const effectiveScheme = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : scheme === 'dark' ? 'dark' : 'light';
  const tokens = palette[effectiveScheme];
  return { ...tokens, radius };
}
