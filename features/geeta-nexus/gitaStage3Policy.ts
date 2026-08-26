import type { GitaDownloadState } from './gitaDownloadManager';

export type GitaDownloadPlan = {
  bootstrapData: boolean;
  audioChapters: number[];
};

/**
 * Offline-first policy:
 * 1. Bootstrap verse/chapter metadata only once.
 * 2. Never re-download a cached chapter.
 * 3. When a user starts a chapter, that chapter is eligible for audio download.
 * 4. Prefetch only the next chapter, one at a time.
 */
export function buildGitaDownloadPlan(
  state: GitaDownloadState,
  openedChapter: number | null,
  totalChapters: number,
): GitaDownloadPlan {
  const audioChapters: number[] = [];

  if (openedChapter && state.audio[openedChapter] !== 'cached') {
    audioChapters.push(openedChapter);
  }

  const next = openedChapter && openedChapter < totalChapters ? openedChapter + 1 : null;
  if (next && state.audio[next] !== 'cached' && audioChapters.length === 0) {
    audioChapters.push(next);
  }

  return {
    bootstrapData: !state.initialized,
    audioChapters,
  };
}

export function canUseOfflineGita(state: GitaDownloadState): boolean {
  return state.initialized;
}
