import type { GitaVerse } from './geetaTypes';

const BASE=process.env.EXPO_PUBLIC_GITA_CDN_URL||'';
export async function loadChapterVersesFromRemote(chapter:number):Promise<GitaVerse[]>{
 if(!BASE) throw new Error('Gita CDN is not configured.');
 const response=await fetch(BASE.replace(/\/$/,'')+'/chapters/'+chapter+'.json');
 if(!response.ok) throw new Error('Gita chapter download failed.');
 const value=await response.json();
 if(!Array.isArray(value)) throw new Error('Invalid Gita chapter data.');
 return value as GitaVerse[];
}
