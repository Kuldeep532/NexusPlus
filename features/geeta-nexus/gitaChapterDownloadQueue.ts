import type { GitaVerse } from './geetaTypes';
import { GITA_CHAPTERS } from './geetaTypes';
import { ensureGitaCacheInitialized, readGitaCache, markChapterDownloading, cacheChapterVerses, markChapterError } from './gitaDownloadManager';

let queue:number[]=[];
let running=false;

export async function enqueueGitaChapterDownload(chapter:number,loader:(chapter:number)=>Promise<GitaVerse[]>):Promise<void>{
 if(!queue.includes(chapter)) queue.push(chapter);
 if(running)return;
 running=true;
 try{
  while(queue.length){
   const current=queue.shift()!;
   let cache=await ensureGitaCacheInitialized(GITA_CHAPTERS);
   if(cache.chapters[current]?.verses.length)continue;
   cache=await markChapterDownloading(cache,current);
   try{const verses=await loader(current);await cacheChapterVerses(cache,current,verses)}
   catch{await markChapterError(cache,current)}
  }
 }finally{running=false}
}
export async function ensureGitaChapterCached(chapter:number,loader:(chapter:number)=>Promise<GitaVerse[]>):Promise<void>{
 const cache=await ensureGitaCacheInitialized(GITA_CHAPTERS);
 if(cache.chapters[chapter]?.verses.length)return;
 await enqueueGitaChapterDownload(chapter,loader);
}
export async function getCachedChapterVerses(chapter:number):Promise<GitaVerse[]>{const cache=await readGitaCache();return cache?.chapters[chapter]?.verses??[]}
