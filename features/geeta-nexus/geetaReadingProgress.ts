import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nexus-plus.geeta-nexus.reading-progress.v1';

export type SacredTextId = 'bhagavad-gita' | 'ramcharitmanas';

export type ReadingProgress = {
  textId: SacredTextId;
  chapter: number;
  verse: number;
  updatedAt: number;
};

async function readAll(): Promise<ReadingProgress[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReadingProgress[];
    return Array.isArray(parsed) ? parsed.filter((item) =>
      (item?.textId === 'bhagavad-gita' || item?.textId === 'ramcharitmanas') &&
      Number.isInteger(item?.chapter) && item.chapter > 0 &&
      Number.isInteger(item?.verse) && item.verse > 0 &&
      Number.isFinite(item?.updatedAt),
    ) : [];
  } catch {
    return [];
  }
}

export async function saveReadingProgress(progress: Omit<ReadingProgress, 'updatedAt'>): Promise<void> {
  const current = await readAll();
  const next = current.filter((item) => item.textId !== progress.textId);
  next.push({ ...progress, updatedAt: Date.now() });
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function getReadingProgress(textId: SacredTextId): Promise<ReadingProgress | null> {
  const all = await readAll();
  return all.find((item) => item.textId === textId) ?? null;
}

export async function getAllReadingProgress(): Promise<ReadingProgress[]> {
  return readAll();
}
