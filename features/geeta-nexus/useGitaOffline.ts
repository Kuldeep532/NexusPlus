import { useCallback, useEffect, useState } from 'react';
import { GITA_CHAPTERS, type GitaVerse } from './geetaTypes';
import { ensureGitaCacheInitialized, readGitaCache, type GitaCache } from './gitaDownloadManager';
import { ensureGitaChapterCached } from './gitaChapterDownloadQueue';

export function useGitaOffline(loadChapterVerses:(chapter:number)=>Promise<GitaVerse[]>) {
 const [cache,setCache]=useState<GitaCache|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 useEffect(()=>{let active=true;(async()=>{try{const current=await ensureGitaCacheInitialized(GITA_CHAPTERS);if(active)setCache(current)}catch(err){if(active)setError(err instanceof Error?err.message:'Could not initialize Gita cache.')}finally{if(active)setLoading(false)}})();return()=>{active=false}},[]);
 const openChapter=useCallback(async(chapter:number)=>{try{await ensureGitaChapterCached(chapter,loadChapterVerses);const next=await readGitaCache();setCache(next)}catch(err){setError(err instanceof Error?err.message:'Chapter download failed.')}},[loadChapterVerses]);
 return {cache,loading,error,openChapter};
}
