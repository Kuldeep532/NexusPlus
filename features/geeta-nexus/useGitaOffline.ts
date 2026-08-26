import { useCallback, useEffect, useState } from 'react';
import { GITA_CHAPTERS } from './geetaTypes';
import { ensureGitaInitialized, readGitaCache, shouldDownloadChapterAudio, chooseNextPrefetchChapter, type GitaCache } from './gitaDownloadManager';

export function useGitaOffline(loadBootstrapData: () => Promise<{ verses: Record<string, import('./geetaTypes').GitaVerse[]> }>) {
  const [cache, setCache] = useState<GitaCache | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const existing = await readGitaCache();
        if (active && existing?.state.initialized) {
          setCache(existing);
          setLoading(false);
          return;
        }
        const initialized = await ensureGitaInitialized(GITA_CHAPTERS, loadBootstrapData);
        if (active) setCache(initialized);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not initialize Gita Nexus offline data.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [loadBootstrapData]);

  const shouldPrefetch = useCallback((currentChapter: number) => {
    if (!cache) return null;
    const nextChapter = chooseNextPrefetchChapter(currentChapter, GITA_CHAPTERS.length);
    return nextChapter && shouldDownloadChapterAudio(cache.state, nextChapter) ? nextChapter : null;
  }, [cache]);

  return { cache, loading, error, shouldPrefetch };
}
