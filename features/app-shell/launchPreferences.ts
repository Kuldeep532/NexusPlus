import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@nexus-plus/launch-preferences';

export type HomeDestination = 'nexus-home' | 'geeta-home';
export type LaunchPreferences = {
  launchTarget: 'nexus-plus';
  homeDestination: HomeDestination;
  showGeetaNexusOnHome: boolean;
  showDiscoverOnHome: boolean;
};

const DEFAULT_PREFERENCES: LaunchPreferences = {
  launchTarget: 'nexus-plus',
  homeDestination: 'nexus-home',
  showGeetaNexusOnHome: true,
  showDiscoverOnHome: false,
};

export async function readLaunchPreferences(): Promise<LaunchPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const value = JSON.parse(raw) as Partial<LaunchPreferences>;
    return {
      launchTarget: 'nexus-plus',
      homeDestination: value.homeDestination === 'geeta-home' ? 'geeta-home' : 'nexus-home',
      showGeetaNexusOnHome: value.showGeetaNexusOnHome !== false,
      showDiscoverOnHome: value.showDiscoverOnHome === true,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function writeLaunchPreferences(next: LaunchPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
    launchTarget: 'nexus-plus',
    homeDestination: next.homeDestination === 'geeta-home' ? 'geeta-home' : 'nexus-home',
    showGeetaNexusOnHome: next.showGeetaNexusOnHome === true,
    showDiscoverOnHome: next.showDiscoverOnHome === true,
  }));
}
