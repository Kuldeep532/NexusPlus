import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GitaChapter, GitaVerse } from './geetaTypes';

const CACHE_KEY='nexus-plus.gita-nexus.cache.v2';
export type GitaDownloadStatus='cached'|'downloading'|'pending'|'error';
export type GitaChapterCache={chapter:GitaChapter;verses:GitaVerse[];status:GitaDownloadStatus;downloadedAtMs:number|null};
export type GitaCache={version:2;chapters:Record<number,GitaChapterCache>;lastSyncedAtMs:number|null};
let memoryCache:GitaCache|null=null;
export async function readGitaCache():Promise<GitaCache|null>{if(memoryCache)return memoryCache;const raw=await AsyncStorage.getItem(CACHE_KEY);if(!raw)return null;try{const p=JSON.parse(raw) as GitaCache;if(p.version!==2)return null;memoryCache=p;return p}catch{return null}}
export async function writeGitaCache(cache:GitaCache){memoryCache=cache;await AsyncStorage.setItem(CACHE_KEY,JSON.stringify(cache))}
export function createInitialGitaCache(chapters:GitaChapter[]):GitaCache{return{version:2,lastSyncedAtMs:null,chapters:Object.fromEntries(chapters.map(ch=>[ch.number,{chapter:ch,verses:[],status:'pending',downloadedAtMs:null}]))}}
export async function ensureGitaCacheInitialized(chapters:GitaChapter[]):Promise<GitaCache>{const existing=await readGitaCache();if(existing)return existing;const next=createInitialGitaCache(chapters);await writeGitaCache(next);return next}
export function getChapter(cache:GitaCache,chapter:number){return cache.chapters[chapter]??null}
export async function markChapterDownloading(cache:GitaCache,chapter:number){const e=getChapter(cache,chapter);if(!e)return cache;const next={...cache,chapters:{...cache.chapters,[chapter]:{...e,status:'downloading' as const}}};await writeGitaCache(next);return next}
export async function cacheChapterVerses(cache:GitaCache,chapter:number,verses:GitaVerse[]){const e=getChapter(cache,chapter);if(!e)throw new Error('Unknown Gita chapter.');const now=Date.now();const next={...cache,lastSyncedAtMs:now,chapters:{...cache.chapters,[chapter]:{...e,verses,status:'cached' as const,downloadedAtMs:now}}};await writeGitaCache(next);return next}
export async function markChapterError(cache:GitaCache,chapter:number){const e=getChapter(cache,chapter);if(!e)return cache;const next={...cache,chapters:{...cache.chapters,[chapter]:{...e,status:'error' as const}}};await writeGitaCache(next);return next}
export function isChapterCached(cache:GitaCache,chapter:number){return cache.chapters[chapter]?.status==='cached'&&cache.chapters[chapter].verses.length>0}
