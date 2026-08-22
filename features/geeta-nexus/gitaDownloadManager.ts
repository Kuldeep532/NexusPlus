import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GitaAudioTrack, GitaChapter, GitaVerse } from './geetaTypes';

const CACHE_KEY = 'nexus-plus.gita-nexus.cache.v1';

export type GitaDownloadState = {
  initialized: boolean;
  chapters: Record<number, 'cached' | 'partial' | 'pending' | 'error'>;
  audio: Record<number, 'cached' | 'partial' | 'pending' | 'error'>;
  lastSyncedAtMs: number | null;
};

export type GitaCache = {
  version: 1;
  chapters: GitaChapter[];
  verses: Record<string, GitaVerse[]>;
  audio: Record<number, GitaAudioTrack[]>;
  state: GitaDownloadState;
};

const EMPTY_STATE: GitaDownloadState = {
  initialized: false,
  chapters: {},
  audio: {},
  lastSyncedAtMs: null,
};

let memoryCache: GitaCache | null = null;

export async function readGitaCache(): Promise<GitaCache | null> {
  if (memoryCache) return memoryCache;
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GitaCache;
    if (parsed?.version !== 1) return null;
    memoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeGitaCache(cache: GitaCache): Promise<void> {
  memoryCache = cache;
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function createInitialGitaCache(chapters: GitaChapter[]): GitaCache {
  return {
    version: 1,
    chapters,
    verses: {},
    audio: {},
    state: { ...EMPTY_STATE },
  };
}

export function markChapterState(cache: GitaCache, chapter: number, status: GitaDownloadState['chapters'][number]): GitaCache {
  return {
    ...cache,
    state: {
      ...cache.state,
      initialized: true,
      chapters: { ...cache.state.chapters, [chapter]: status },
    },
  };
}

export function markAudioState(cache: GitaCache, chapter: number, status: GitaDownloadState['audio'][number]): GitaCache {
  return {
    ...cache,
    state: {
      ...cache.state,
      initialized: true,
      audio: { ...cache.state.audio, [chapter]: status },
    },
  };
}

export async function ensureGitaInitialized(
  chapters: GitaChapter[],
  loadBootstrapData: () => Promise<{ verses: Record<string, GitaVerse[]> }>,
): Promise<GitaCache> {
  const existing = await readGitaCache();
  if (existing?.state.initialized) return existing;

  const bootstrap = await loadBootstrapData();
  const next: GitaCache = {
    ...createInitialGitaCache(chapters),
    verses: bootstrap.verses,
    state: {
      ...EMPTY_STATE,
      initialized: true,
      lastSyncedAtMs: Date.now(),
      chapters: Object.fromEntries(chapters.map((chapter) => [chapter.number, 'cached'])),
    },
  };
  await writeGitaCache(next);
  return next;
}

export async function cacheChapterAudio(
  chapter: number,
  tracks: GitaAudioTrack[],
  cacheOverride?: GitaCache,
): Promise<GitaCache> {
  const cache = cacheOverride ?? (await readGitaCache());
  if (!cache) throw new Error('Gita cache is not initialized.');

  const next: GitaCache = {
    ...cache,
    audio: { ...cache.audio, [chapter]: tracks },
    state: {
      ...cache.state,
      audio: { ...cache.state.audio, [chapter]: 'cached' },
    },
  };
  await writeGitaCache(next);
  return next;
}

export function shouldDownloadChapterAudio(state: GitaDownloadState, chapter: number): boolean {
  return state.audio[chapter] !== 'cached';
}

export function chooseNextPrefetchChapter(currentChapter: number, maxChapter: number): number | null {
  return currentChapter < maxChapter ? currentChapter + 1 : null;
}
