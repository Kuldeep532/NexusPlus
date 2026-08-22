import * as SecureStore from 'expo-secure-store';

export type FeatureTtsLanguage = 'en-IN' | 'hi-IN';
export type VoiceEnginePreference = 'auto' | 'system';

export type LanguagePreferences = {
  featureTtsLanguage: FeatureTtsLanguage;
  bookReaderLanguage: FeatureTtsLanguage;
  voiceEngine: VoiceEnginePreference;
};

const KEY = 'nexus-plus.language-preferences';
const DEFAULTS: LanguagePreferences = { featureTtsLanguage: 'en-IN', bookReaderLanguage: 'en-IN', voiceEngine: 'auto' };

export async function loadLanguagePreferences(): Promise<LanguagePreferences> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<LanguagePreferences>;
    return {
      featureTtsLanguage: parsed.featureTtsLanguage === 'hi-IN' ? 'hi-IN' : 'en-IN',
      bookReaderLanguage: parsed.bookReaderLanguage === 'hi-IN' ? 'hi-IN' : 'en-IN',
      voiceEngine: parsed.voiceEngine === 'system' ? 'system' : 'auto',
    };
  } catch { return DEFAULTS; }
}

export async function saveLanguagePreferences(value: LanguagePreferences): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(value));
}
export async function getFeatureTtsLanguage(): Promise<FeatureTtsLanguage> { return (await loadLanguagePreferences()).featureTtsLanguage; }
export async function getBookReaderLanguage(): Promise<FeatureTtsLanguage> { return (await loadLanguagePreferences()).bookReaderLanguage; }
export async function getVoiceEnginePreference(): Promise<VoiceEnginePreference> { return (await loadLanguagePreferences()).voiceEngine; }
