import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nexus.focus-assist.voice-commands.enabled';

export async function getVoiceCommandsEnabled(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored !== 'false';
  } catch {
    return true;
  }
}

export async function setVoiceCommandsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
}
