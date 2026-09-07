import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BookAssistantContext } from './bookContext';

const STORAGE_KEY = 'nexus-plus.assistant.active-book.v1';

export async function setActiveBookContext(context: BookAssistantContext): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

export async function getActiveBookContext(): Promise<BookAssistantContext | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BookAssistantContext>;
    if (
      typeof parsed.documentId !== 'string' ||
      typeof parsed.title !== 'string' ||
      typeof parsed.format !== 'string' ||
      typeof parsed.text !== 'string' ||
      typeof parsed.truncated !== 'boolean'
    ) return null;
    return parsed as BookAssistantContext;
  } catch {
    return null;
  }
}

export async function clearActiveBookContext(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
