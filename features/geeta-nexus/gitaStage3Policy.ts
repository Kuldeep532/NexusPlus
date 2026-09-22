import type { GitaCache } from './gitaDownloadManager';
export function chapterIsReady(cache:GitaCache,chapter:number):boolean{
 const item=cache.chapters[chapter];
 return item?.status==='cached' && item.verses.length>0;
}
