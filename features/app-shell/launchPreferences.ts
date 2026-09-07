import AsyncStorage from '@react-native-async-storage/async-storage';

export type LaunchTarget = 'nexus-plus';

const STORAGE_KEY = 'nexus-plus.launch-preferences.v2';

export interface LaunchPreferences {
  launchTarget: LaunchTarget;
  showGeetaNexusOnHome: false;
}

export const DEFAULT_LAUNCH_PREFERENCES: LaunchPreferences = {
  launchTarget: 'nexus-plus',
  showGeetaNexusOnHome: false,
};

export async function readLaunchPreferences(): Promise<LaunchPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAUNCH_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<LaunchPreferences>;
    return DEFAULT_LAUNCH_PREFERENCES;
  } catch {
    return DEFAULT_LAUNCH_PREFERENCES;
  }
}

export async function writeLaunchPreferences(next: LaunchPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function getLaunchRoute(): Promise<'/(tabs)'> {
  return '/(tabs)';
}

export { STORAGE_KEY as LAUNCH_PREFERENCES_STORAGE_KEY };
