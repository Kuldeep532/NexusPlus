import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SketchDocument } from './sketchEngine';

const DRAFT_KEY = 'nexusplus.paint-generator.draft.v1';

export interface SketchDraft {
  id: string;
  document: SketchDocument;
  mode: 'traditional' | 'text';
  title: string;
  updatedAt: number;
}

export async function saveSketchDraft(draft: SketchDraft): Promise<void> {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export async function loadSketchDraft(): Promise<SketchDraft | null> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SketchDraft;
    if (!parsed?.id || !parsed?.document?.strokes || !parsed?.document?.width) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function deleteSketchDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}
