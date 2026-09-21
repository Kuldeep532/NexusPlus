import AsyncStorage from '@react-native-async-storage/async-storage';

export type PasswordGeneratorProvider = 'nexus' | 'google';

export interface PasswordManagerPreferences {
  defaultGenerator: PasswordGeneratorProvider;
  showCopyAction: boolean;
  requireBiometricForReveal: boolean;
}

const KEY = 'nexusplus.password-manager.preferences.v1';
const DEFAULTS: PasswordManagerPreferences = {
  defaultGenerator: 'nexus',
  showCopyAction: true,
  requireBiometricForReveal: true,
};

export async function loadPasswordManagerPreferences(): Promise<PasswordManagerPreferences> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<PasswordManagerPreferences>;
    return {
      ...DEFAULTS,
      ...parsed,
      defaultGenerator: parsed.defaultGenerator === 'google' ? 'google' : 'nexus',
    };
  } catch {
    return DEFAULTS;
  }
}

export async function savePasswordManagerPreferences(next: PasswordManagerPreferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
