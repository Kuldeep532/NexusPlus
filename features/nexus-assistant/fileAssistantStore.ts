import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AssistantFileContext } from './fileContext';

const STORAGE_KEY = 'nexus-plus.assistant.active-file.v1';

export type ActiveFileContext = AssistantFileContext & { promptContext: string };

export async function setActiveFileContext(context: ActiveFileContext): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

export async function getActiveFileContext(): Promise<ActiveFileContext | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as ActiveFileContext;
  } catch {
    return null;
  }
}

export async function clearActiveFileContext(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
