import AsyncStorage from '@react-native-async-storage/async-storage';

export type LaunchTarget = 'nexus-plus' | 'geeta-nexus';

const STORAGE_KEY = 'nexus-plus.launch-preferences.v1';

export interface LaunchPreferences {
  launchTarget: LaunchTarget;
  showGeetaNexusOnHome: boolean;
}

export const DEFAULT_LAUNCH_PREFERENCES: LaunchPreferences = {
  launchTarget: 'nexus-plus',
  showGeetaNexusOnHome: true,
};

export async function readLaunchPreferences(): Promise<LaunchPreferences> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_LAUNCH_PREFERENCES;
  try {
    const parsed = JSON.parse(raw) as Partial<LaunchPreferences>;
    return {
      launchTarget: parsed.launchTarget === 'geeta-nexus' ? 'geeta-nexus' : 'nexus-plus',
      showGeetaNexusOnHome: parsed.showGeetaNexusOnHome !== false,
    };
  } catch {
    return DEFAULT_LAUNCH_PREFERENCES;
  }
}

export async function writeLaunchPreferences(next: LaunchPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function getLaunchRoute(): Promise<'/home' | '/geeta-nexus'> {
  const preferences = await readLaunchPreferences();
  return preferences.launchTarget === 'geeta-nexus' ? '/geeta-nexus' : '/home';
}

export { STORAGE_KEY as LAUNCH_PREFERENCES_STORAGE_KEY };
