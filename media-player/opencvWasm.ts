import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';

const STORAGE_KEY='@nexus-plus/opencv-wasm-cache-v2';
const CACHE_VERSION='opencv.js-4.x-runtime';
const DEFAULT_CDN='https://docs.opencv.org/4.x/opencv.js';
const CACHE_DIR=new Directory(Paths.document,'opencv-wasm');

export type OpenCvLoadState={
  status:'idle'|'loading'|'ready'|'error';
  scriptUri?:string;
  wasmUri?:string;
  version:string;
  downloadedNow?:boolean;
  error?:string;
};

type CacheRecord={version:string;scriptUri:string;wasmUri?:string;size:number};

let state:OpenCvLoadState={status:'idle',version:CACHE_VERSION};
let inFlight:Promise<OpenCvLoadState>|null=null;

async function readRecord():Promise<CacheRecord|null>{
  try{
    const raw=await AsyncStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const parsed=JSON.parse(raw) as CacheRecord;
    return parsed?.version===CACHE_VERSION&&typeof parsed.scriptUri==='string'?parsed:null;
  }catch{return null;}
}

async function writeRecord(record:CacheRecord):Promise<void>{
  await AsyncStorage.setItem(STORAGE_KEY,JSON.stringify(record));
}

async function fileIsUsable(uri:string):Promise<boolean>{
  try{
    const file=new File(uri);
    return file.exists && file.size>1024;
  }catch{return false;}
}

export async function getOpenCvWasmConfig():Promise<{scriptUrl:string;wasmUrl:string}>{
  return {
    scriptUrl:(process.env.EXPO_PUBLIC_OPENCV_JS_URL||DEFAULT_CDN).trim(),
    wasmUrl:(process.env.EXPO_PUBLIC_OPENCV_WASM_URL||'').trim(),
  };
}

/**
 * Downloads OpenCV.js once into app-private storage. Subsequent launches reuse the
 * cached local script without network access unless the cache record is invalid.
 *
 * Note: the official OpenCV.js build may locate its companion .wasm beside the
 * script. wasmUrl is therefore configurable for a pinned/self-hosted build.
 */
export async function ensureOpenCvWasm():Promise<OpenCvLoadState>{
  if(state.status==='ready') return state;
  if(inFlight) return inFlight;
  inFlight=(async()=>{
    state={status:'loading',version:CACHE_VERSION};
    try{
      const existing=await readRecord();
      if(existing && await fileIsUsable(existing.scriptUri) && (!existing.wasmUri || await fileIsUsable(existing.wasmUri))){
        state={status:'ready',version:CACHE_VERSION,scriptUri:existing.scriptUri,wasmUri:existing.wasmUri,downloadedNow:false};
        return state;
      }

      const {scriptUrl,wasmUrl}=await getOpenCvWasmConfig();
      if(!/^https:\/\//i.test(scriptUrl)) throw new Error('OpenCV.js URL must use HTTPS.');
      CACHE_DIR.create({intermediates:true,idempotent:true});

      const scriptFile=new File(CACHE_DIR,'opencv.js');
      if(!scriptFile.exists || scriptFile.size<=1024){
        const downloaded=await File.downloadFileAsync(scriptUrl,scriptFile);
        if(!downloaded.exists || downloaded.size<=1024) throw new Error('OpenCV.js download was incomplete.');
      }

      let wasmUri:string|undefined;
      if(wasmUrl){
        if(!/^https:\/\//i.test(wasmUrl)) throw new Error('OpenCV WASM URL must use HTTPS.');
        const wasmFile=new File(CACHE_DIR,'opencv_js.wasm');
        if(!wasmFile.exists || wasmFile.size<=1024){
          const downloaded=await File.downloadFileAsync(wasmUrl,wasmFile);
          if(!downloaded.exists || downloaded.size<=1024) throw new Error('OpenCV WASM download was incomplete.');
        }
        wasmUri=wasmFile.uri;
      }

      const record={version:CACHE_VERSION,scriptUri:scriptFile.uri,wasmUri,size:scriptFile.size+(wasmUri?new File(wasmUri).size:0)};
      await writeRecord(record);
      state={status:'ready',version:CACHE_VERSION,scriptUri:scriptFile.uri,wasmUri,downloadedNow:true};
      return state;
    }catch(error){
      state={status:'error',version:CACHE_VERSION,error:error instanceof Error?error.message:'OpenCV.js unavailable'};
      return state;
    }finally{inFlight=null;}
  })();
  return inFlight;
}

export async function getOpenCvLoadState():Promise<OpenCvLoadState>{
  return state;
}
