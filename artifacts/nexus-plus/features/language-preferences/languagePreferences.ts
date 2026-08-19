import * as SecureStore from 'expo-secure-store';

export type FeatureTtsLanguage = 'hi-IN' | 'en-IN';

export type LanguagePreferences = {
  featureTtsLanguage: FeatureTtsLanguage;
  bookReaderLanguage: FeatureTtsLanguage;
};

export const DEFAULT_LANGUAGE_PREFERENCES: LanguagePreferences = {
  featureTtsLanguage: 'en-IN',
  bookReaderLanguage: 'en-IN',
};

const STORAGE_KEY = 'nexus_plus_language_preferences_v1';

export async function loadLanguagePreferences(): Promise<LanguagePreferences> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return DEFAULT_LANGUAGE_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<LanguagePreferences>;
    return {
      featureTtsLanguage: parsed.featureTtsLanguage === 'hi-IN' ? 'hi-IN' : 'en-IN',
      bookReaderLanguage: parsed.bookReaderLanguage === 'hi-IN' ? 'hi-IN' : 'en-IN',
    };
  } catch {
    return DEFAULT_LANGUAGE_PREFERENCES;
  }
}

export async function saveLanguagePreferences(value: LanguagePreferences): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(value));
}
