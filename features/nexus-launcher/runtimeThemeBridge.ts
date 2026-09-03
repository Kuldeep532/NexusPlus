export type LauncherThemeMode = 'system-dynamic' | 'nexus-ocean' | 'nexus-classic' | 'nexus-light' | 'nexus-dark';

export type LauncherThemeSnapshot = {
  mode: LauncherThemeMode;
  source: 'android-system' | 'nexus-plus';
  primarySeed?: string;
  updatedAt: number;
};

const DEFAULT_THEME: LauncherThemeSnapshot = {
  mode: 'system-dynamic',
  source: 'android-system',
  updatedAt: 0,
};

/**
 * Lightweight bridge contract for a future native event emitter. No network/API
 * dependency is used; the Android launcher remains the source of live system colors.
 */
export function createLauncherThemeSnapshot(mode: LauncherThemeMode = DEFAULT_THEME.mode): LauncherThemeSnapshot {
  return {
    mode,
    source: mode === 'system-dynamic' ? 'android-system' : 'nexus-plus',
    updatedAt: Date.now(),
  };
}
