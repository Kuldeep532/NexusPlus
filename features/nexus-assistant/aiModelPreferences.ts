import AsyncStorage from '@react-native-async-storage/async-storage';

export type AssistantModelId = 'gemini' | 'openai' | 'anthropic';

export type AssistantModelPreference = {
  selectedModel: AssistantModelId;
};

const KEY = 'nexus-plus.assistant.model-preference.v1';

export async function getAssistantModelPreference(): Promise<AssistantModelPreference> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { selectedModel: 'gemini' };
    const parsed = JSON.parse(raw) as Partial<AssistantModelPreference>;
    return parsed.selectedModel === 'openai' || parsed.selectedModel === 'anthropic' || parsed.selectedModel === 'gemini'
      ? { selectedModel: parsed.selectedModel }
      : { selectedModel: 'gemini' };
  } catch {
    return { selectedModel: 'gemini' };
  }
}

export async function setAssistantModelPreference(selectedModel: AssistantModelId): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ selectedModel }));
}
