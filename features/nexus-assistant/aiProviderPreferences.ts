import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getAssistantModelPreference, type AssistantModelId } from './aiModelPreferences';

const KEY_PREFIX = 'nexus-plus.assistant.provider-api-key.v2.';
const LEGACY_PREFIX = 'nexus-plus.assistant.provider-api-key.v1.';

export async function getCustomProviderApiKey(provider: Exclude<AssistantModelId, 'gemini'>): Promise<string | null> {
  try {
    const secure = await SecureStore.getItemAsync(KEY_PREFIX + provider);
    if (secure?.trim()) return secure.trim();
    const legacy = await AsyncStorage.getItem(LEGACY_PREFIX + provider);
    if (legacy?.trim()) {
      await SecureStore.setItemAsync(KEY_PREFIX + provider, legacy.trim());
      await AsyncStorage.removeItem(LEGACY_PREFIX + provider);
      return legacy.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export async function setCustomProviderApiKey(provider: Exclude<AssistantModelId, 'gemini'>, key: string): Promise<void> {
  const normalized = key.trim();
  if (!normalized) {
    await SecureStore.deleteItemAsync(KEY_PREFIX + provider);
    return;
  }
  await SecureStore.setItemAsync(KEY_PREFIX + provider, normalized);
}

export async function getCustomElevenLabsApiKey(): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync('nexus-plus.assistant.provider-api-key.v2.elevenlabs');
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export async function setCustomElevenLabsApiKey(key: string): Promise<void> {
  const normalized = key.trim();
  if (!normalized) {
    await SecureStore.deleteItemAsync('nexus-plus.assistant.provider-api-key.v2.elevenlabs');
    return;
  }
  await SecureStore.setItemAsync('nexus-plus.assistant.provider-api-key.v2.elevenlabs', normalized);
}

export async function getConfiguredAssistantModel(): Promise<AssistantModelId> {
  return (await getAssistantModelPreference()).selectedModel;
}
