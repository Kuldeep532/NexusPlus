import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GitaVerse } from './geetaTypes';

const CACHE_KEY = 'nexus-plus.geeta-nexus.stage5.verses.v1';
const VERSION_KEY = 'nexus-plus.geeta-nexus.stage5.version';

export interface GitaVerseBundle {
  version: string;
  verses: GitaVerse[];
}

export interface GitaSourceAdapter {
  loadBundle(): Promise<GitaVerseBundle | null>;
}

function isValidVerse(value: unknown): value is GitaVerse {
  if (!value || typeof value !== 'object') return false;
  const verse = value as Partial<GitaVerse>;
  return (
    typeof verse.id === 'string' &&
    typeof verse.chapter === 'number' &&
    typeof verse.verse === 'number' &&
    typeof verse.sanskrit === 'string'
  );
}

export async function saveVerifiedVerseBundle(bundle: GitaVerseBundle): Promise<void> {
  const validVerses = bundle.verses.filter(isValidVerse);
  if (!bundle.version || validVerses.length === 0) throw new Error('Invalid Gita verse bundle.');
  await AsyncStorage.multiSet([
    [CACHE_KEY, JSON.stringify({ version: bundle.version, verses: validVerses })],
    [VERSION_KEY, bundle.version],
  ]);
}

export async function loadCachedVerseBundle(): Promise<GitaVerseBundle | null> {
  const [cached, version] = await AsyncStorage.multiGet([CACHE_KEY, VERSION_KEY]);
  const raw = cached[0][1];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GitaVerseBundle;
    if (!parsed?.version || parsed.version !== version[0][1] || !Array.isArray(parsed.verses)) return null;
    const verses = parsed.verses.filter(isValidVerse);
    return verses.length ? { version: parsed.version, verses } : null;
  } catch {
    return null;
  }
}

export async function hydrateVerifiedVerses(adapter: GitaSourceAdapter): Promise<GitaVerseBundle | null> {
  const cached = await loadCachedVerseBundle();
  if (cached) return cached;

  const downloaded = await adapter.loadBundle();
  if (!downloaded) return null;
  await saveVerifiedVerseBundle(downloaded);
  return downloaded;
}
