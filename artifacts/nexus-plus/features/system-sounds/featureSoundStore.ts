import { SecureStore } from 'expo-secure-store';
import { DEFAULT_FEATURE_SOUND_SETTINGS, type FeatureSoundSettings } from './featureSoundTypes';

const KEY = 'nexusplus.feature-sound-settings.v1';

export async function loadFeatureSoundSettings(): Promise<FeatureSoundSettings> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return DEFAULT_FEATURE_SOUND_SETTINGS;
    return { ...DEFAULT_FEATURE_SOUND_SETTINGS, ...(JSON.parse(raw) as Partial<FeatureSoundSettings>) };
  } catch {
    return DEFAULT_FEATURE_SOUND_SETTINGS;
  }
}

export async function saveFeatureSoundSettings(settings: FeatureSoundSettings): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(settings));
}
