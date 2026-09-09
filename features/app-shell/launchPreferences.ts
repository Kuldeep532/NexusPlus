import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@nexus-plus/launch-preferences';

export type LaunchPreferences = {
  launchTarget: 'nexus-plus';
  showGeetaNexusOnHome: boolean;
};

const DEFAULT_PREFERENCES: LaunchPreferences = {
  launchTarget: 'nexus-plus',
  showGeetaNexusOnHome: false,
};

export async function readLaunchPreferences(): Promise<LaunchPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_PREFERENCES;
    const value = parsed as Partial<LaunchPreferences>;
    return {
      launchTarget: 'nexus-plus',
      showGeetaNexusOnHome: value.showGeetaNexusOnHome === true,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function writeLaunchPreferences(next: LaunchPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
    launchTarget: 'nexus-plus',
    showGeetaNexusOnHome: next.showGeetaNexusOnHome === true,
  }));
}
