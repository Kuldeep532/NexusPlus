import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type { RemoteMantraAudio } from './mantraAudioCatalog';

const INDEX_KEY='@nexus-plus/spiritual/mantra-audio-cache-v1';
const DIR=((FileSystem.documentDirectory||FileSystem.cacheDirectory||'')+'spiritual-mantra-audio/').replace(/\\/g,'/');
type Entry={id:string;localUri:string;sourceUrl:string;downloadedAt:number;bytes?:number};
async function readIndex():Promise<Entry[]>{try{return JSON.parse((await AsyncStorage.getItem(INDEX_KEY))||'[]')}catch{return[]}}
async function writeIndex(v:Entry[]){await AsyncStorage.setItem(INDEX_KEY,JSON.stringify(v))}
export async function getCachedMantraAudio(item:RemoteMantraAudio):Promise<string>{
  if(!DIR) throw new Error('Local storage is unavailable.');
  await FileSystem.makeDirectoryAsync(DIR,{intermediates:true});
  const existing=(await readIndex()).find(x=>x.id===item.id);
  if(existing){const info=await FileSystem.getInfoAsync(existing.localUri);if(info.exists)return existing.localUri}
  const destination=DIR+encodeURIComponent(item.id)+'.ogg';
  const result=await FileSystem.downloadAsync(item.url,destination);
  const info=await FileSystem.getInfoAsync(result.uri);
  const next=(await readIndex()).filter(x=>x.id!==item.id);
  next.push({id:item.id,localUri:result.uri,sourceUrl:item.url,downloadedAt:Date.now(),bytes:'size' in info?info.size:undefined});
  await writeIndex(next);
  return result.uri;
}
export async function clearMantraAudioCache(){try{await FileSystem.deleteAsync(DIR,{idempotent:true})}finally{await AsyncStorage.removeItem(INDEX_KEY)}}