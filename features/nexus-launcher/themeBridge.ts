export type LauncherTheme = {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  accent: string;
  accentSurface: string;
};

const THEMES: Record<string, LauncherTheme> = {
  'ocean-blue': {
    background: '#F4F8FC', surface: '#FFFFFF', foreground: '#10233D', muted: '#607086', accent: '#1667C7', accentSurface: '#E4F0FF',
  },
  classic: {
    background: '#F5FAF6', surface: '#FFFFFF', foreground: '#10251A', muted: '#65766B', accent: '#18864B', accentSurface: '#E4F5EB',
  },
  light: {
    background: '#F7F7F7', surface: '#FFFFFF', foreground: '#171717', muted: '#666666', accent: '#303030', accentSurface: '#EDEDED',
  },
  dark: {
    background: '#101214', surface: '#181B1F', foreground: '#F5F7FA', muted: '#A7AFBA', accent: '#8AB4F8', accentSurface: '#202A38',
  },
  system: {
    background: '#F4F6F8', surface: '#FFFFFF', foreground: '#17202A', muted: '#63707D', accent: '#4C6FFF', accentSurface: '#E9EDFF',
  },
};

export function getLauncherTheme(theme: string): LauncherTheme {
  return THEMES[theme] ?? THEMES['ocean-blue'];
}

export function clampHexColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
}

/**
 * The launcher consumes semantic colors, not raw theme-provider internals.
 * This keeps the Home surface stable even when the app theme implementation evolves.
 */
export function buildThemeFromWallpaperSeed(seed?: string): LauncherTheme {
  if (!seed) return THEMES['ocean-blue'];
  const normalized = seed.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).padEnd(6, '6');
  const accent = `#${normalized}`;
  return {
    background: '#F5F7FA',
    surface: '#FFFFFF',
    foreground: '#161A1E',
    muted: '#68717A',
    accent,
    accentSurface: '#EEF2F7',
  };
}
