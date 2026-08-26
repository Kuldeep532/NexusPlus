import type { GitaAudioTrack, GitaVerse } from './geetaTypes';
import { cacheChapterAudio, readGitaCache } from './gitaDownloadManager';
import { buildGitaDownloadPlan } from './gitaStage3Policy';

export interface GitaDataSource {
  loadBootstrap(): Promise<{ verses: Record<string, GitaVerse[]> }>;
  loadChapterAudio(chapter: number): Promise<GitaAudioTrack[]>;
}

export async function initializeGitaOnce(source: GitaDataSource) {
  const { GITA_CHAPTERS } = await import('./geetaTypes');
  const { ensureGitaInitialized } = await import('./gitaDownloadManager');
  return ensureGitaInitialized(GITA_CHAPTERS, source.loadBootstrap);
}

export async function downloadNeededChapterAudio(source: GitaDataSource, openedChapter: number): Promise<number[]> {
  const cache = await readGitaCache();
  if (!cache) return [];

  const plan = buildGitaDownloadPlan(cache.state, openedChapter, cache.chapters.length);
  const downloaded: number[] = [];
  for (const chapter of plan.audioChapters) {
    const tracks = await source.loadChapterAudio(chapter);
    await cacheChapterAudio(chapter, tracks, cache);
    downloaded.push(chapter);
  }
  return downloaded;
}
