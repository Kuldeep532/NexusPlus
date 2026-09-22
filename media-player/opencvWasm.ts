import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY='@nexus-plus/opencv-wasm-cache';
const DEFAULT_CDN='https://docs.opencv.org/4.x/opencv.js';

type OpenCvState={status:'idle'|'loading'|'ready'|'error'; scriptUri?:string; error?:string};

let state:OpenCvState={status:'idle'};

export async function getOpenCvWasmConfig():Promise<{scriptUrl:string; wasmUrl:string}> {
  const scriptUrl=(process.env.EXPO_PUBLIC_OPENCV_JS_URL||DEFAULT_CDN).trim();
  const wasmUrl=(process.env.EXPO_PUBLIC_OPENCV_WASM_URL||'').trim();
  return {scriptUrl, wasmUrl};
}

export async function readOpenCvCache():Promise<string|null>{
  try{return await AsyncStorage.getItem(CACHE_KEY);}catch{return null;}
}

export async function markOpenCvCached(uri:string):Promise<void>{
  try{await AsyncStorage.setItem(CACHE_KEY,uri);}catch{}
}

export async function ensureOpenCvWasm():Promise<OpenCvState>{
  if(state.status==='ready'||state.status==='loading') return state;
  state={status:'loading'};
  try{
    const cached=await readOpenCvCache();
    const {scriptUrl}=await getOpenCvWasmConfig();
    state={status:'ready',scriptUri:cached||scriptUrl};
    if(!cached) await markOpenCvCached(scriptUrl);
    return state;
  }catch(error){
    state={status:'error',error:error instanceof Error?error.message:'OpenCV.js unavailable'};
    return state;
  }
}
