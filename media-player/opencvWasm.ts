import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY='@nexus-plus/opencv-wasm-cache';
const DEFAULT_CDN='https://docs.opencv.org/4.x/opencv.js';

export type OpenCvLoadState={status:'idle'|'loading'|'ready'|'error';scriptUri?:string;error?:string};

let state:OpenCvLoadState={status:'idle'};

export async function getOpenCvWasmConfig():Promise<{scriptUrl:string;wasmUrl:string}>{
  return {
    scriptUrl:(process.env.EXPO_PUBLIC_OPENCV_JS_URL||DEFAULT_CDN).trim(),
    wasmUrl:(process.env.EXPO_PUBLIC_OPENCV_WASM_URL||'').trim(),
  };
}

export async function readOpenCvCache():Promise<string|null>{
  try{return await AsyncStorage.getItem(CACHE_KEY);}catch{return null;}
}

export async function markOpenCvCached(uri:string):Promise<void>{
  try{await AsyncStorage.setItem(CACHE_KEY,uri);}catch{}
}

export async function getOpenCvLoadState():Promise<OpenCvLoadState>{return state;}

export async function ensureOpenCvWasm():Promise<OpenCvLoadState>{
  if(state.status==='ready'||state.status==='loading') return state;
  state={status:'loading'};
  try{
    const cached=await readOpenCvCache();
    const {scriptUrl}=await getOpenCvWasmConfig();
    const scriptUri=cached||scriptUrl;
    if(!/^https:\/\//i.test(scriptUri)&&!/^file:\/\//i.test(scriptUri)){
      throw new Error('OpenCV.js URL must be HTTPS or local file URI.');
    }
    await markOpenCvCached(scriptUri);
    state={status:'loading',scriptUri};
    return state;
  }catch(error){
    state={status:'error',error:error instanceof Error?error.message:'OpenCV.js unavailable'};
    return state;
  }
}
