import type { GitaVerse } from './geetaTypes';
import { ensureGitaChapterCached } from './gitaChapterDownloadQueue';

export interface GitaDataSource {
  loadChapterVerses(chapter:number):Promise<GitaVerse[]>;
}
export async function ensureChapterReady(source:GitaDataSource,chapter:number){
  await ensureGitaChapterCached(chapter,source.loadChapterVerses);
}
