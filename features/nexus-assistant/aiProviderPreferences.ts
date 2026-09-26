import AsyncStorage from '@react-native-async-storage/async-storage';

import { getAssistantModelPreference, type AssistantModelId } from './aiModelPreferences';

const KEY_PREFIX = 'nexus-plus.assistant.provider-api-key.v1.';

export async function getCustomProviderApiKey(provider: Exclude<AssistantModelId, 'gemini'>): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(KEY_PREFIX + provider);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export async function setCustomProviderApiKey(
  provider: Exclude<AssistantModelId, 'gemini'>,
  key: string,
): Promise<void> {
  const normalized = key.trim();
  if (!normalized) {
    await AsyncStorage.removeItem(KEY_PREFIX + provider);
    return;
  }
  await AsyncStorage.setItem(KEY_PREFIX + provider, normalized);
}

export async function getConfiguredAssistantModel(): Promise<AssistantModelId> {
  return (await getAssistantModelPreference()).selectedModel;
}
