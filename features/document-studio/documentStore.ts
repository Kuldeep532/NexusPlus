import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type { DocumentRecord } from './documentTypes';
import { DOCUMENT_STUDIO_STORAGE_KEY } from './documentTypes';

export async function listDocuments(): Promise<DocumentRecord[]> {
  const raw = await AsyncStorage.getItem(DOCUMENT_STUDIO_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as DocumentRecord[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

export async function saveDocumentRecord(record: DocumentRecord): Promise<void> {
  const current = await listDocuments();
  const index = current.findIndex((item) => item.id === record.id);
  if (index >= 0) current[index] = record;
  else current.unshift(record);
  await AsyncStorage.setItem(DOCUMENT_STUDIO_STORAGE_KEY, JSON.stringify(current.slice(0, 200)));
}

export async function removeDocumentRecord(id: string): Promise<void> {
  const current = await listDocuments();
  await AsyncStorage.setItem(DOCUMENT_STUDIO_STORAGE_KEY, JSON.stringify(current.filter((item) => item.id !== id)));
}

export async function getDocumentRecord(id: string): Promise<DocumentRecord | null> {
  const current = await listDocuments();
  return current.find((item) => item.id === id) ?? null;
}

export async function documentExists(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}
