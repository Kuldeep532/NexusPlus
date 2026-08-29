import { useColorScheme } from 'react-native';
import { useEffect, useSyncExternalStore } from 'react';
import { readThemeColor, type ThemeColor } from '@/features/app-shell/themePreferences';
import { palettes, radius, type ColorTokens } from '@/constants/colors';

let selectedTheme: ThemeColor = 'ocean-blue';
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() { return selectedTheme; }
function getServerSnapshot() { return 'ocean-blue' as ThemeColor; }

export function refreshThemeColor(theme: ThemeColor) {
  selectedTheme = theme;
  listeners.forEach((listener) => listener());
}

export function useColors(): ColorTokens & { radius: number } {
  const scheme = useColorScheme();
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    let active = true;
    void readThemeColor().then((stored) => {
      if (active && stored !== selectedTheme) refreshThemeColor(stored);
    });
    return () => { active = false; };
  }, []);

  const paletteName = theme === 'ocean-blue' ? 'oceanBlue' : theme === 'classic' ? 'classic' : 'light';
  const palette = palettes[paletteName];
  const effectiveScheme = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : scheme === 'dark' ? 'dark' : 'light';
  return { ...palette[effectiveScheme], radius };
}
