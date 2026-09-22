import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export type ModelDownloadRequest = {
  id: string;
  url: string;
  destination: string;
  expectedSizeBytes?: number;
  sha256?: string;
  priority?: number;
};

export type ModelDownloadResult = { id: string; uri: string; downloadedNow: boolean; sizeBytes: number };

const INDEX_KEY='@nexus-plus/model-download-index-v1';
const active=new Map<string,Promise<ModelDownloadResult>>();
let lastNetworkStartAt=0;
const MIN_GAP_MS=750;
let queue: Array<{request:ModelDownloadRequest;resolve:(value:ModelDownloadResult)=>void;reject:(reason:unknown)=>void}>=[];
let running=false;

async function readIndex():Promise<Record<string,{uri:string;sizeBytes:number;sha256?:string}>>{
  try{const raw=await AsyncStorage.getItem(INDEX_KEY); return raw ? JSON.parse(raw) as Record<string,{uri:string;sizeBytes:number;sha256?:string}> : {};}catch{return {};}
}
async function writeIndex(index:Record<string,{uri:string;sizeBytes:number;sha256?:string}>){await AsyncStorage.setItem(INDEX_KEY,JSON.stringify(index));}
async function valid(uri:string,expectedSizeBytes?:number):Promise<boolean>{
  try{const info=await FileSystem.getInfoAsync(uri); return info.exists && 'size' in info && Number(info.size)>0 && (!expectedSizeBytes || Number(info.size)===expectedSizeBytes);}catch{return false;}
}

async function download(request:ModelDownloadRequest):Promise<ModelDownloadResult>{
  const index=await readIndex();
  const recorded=index[request.id];
  if(recorded && await valid(recorded.uri,request.expectedSizeBytes)) return {id:request.id,uri:recorded.uri,downloadedNow:false,sizeBytes:recorded.sizeBytes};

  const directory=request.destination.slice(0,request.destination.lastIndexOf('/'));
  if(directory) await FileSystem.makeDirectoryAsync(directory,{intermediates:true});
  const temp=request.destination+'.download';
  try{await FileSystem.deleteAsync(temp,{idempotent:true});}catch{}
  const task=FileSystem.createDownloadResumable(request.url,temp);
  const result=await task.downloadAsync();
  if(!result?.uri || !(await valid(result.uri,request.expectedSizeBytes))) throw new Error(`Model download failed integrity check: ${request.id}`);
  await FileSystem.deleteAsync(request.destination,{idempotent:true});
  await FileSystem.moveAsync({from:result.uri,to:request.destination});
  const finalInfo=await FileSystem.getInfoAsync(request.destination);
  const sizeBytes='size' in finalInfo ? Number(finalInfo.size) : 0;
  if(!await valid(request.destination,request.expectedSizeBytes)) throw new Error(`Model could not be finalized: ${request.id}`);
  index[request.id]={uri:request.destination,sizeBytes,sha256:request.sha256};
  await writeIndex(index);
  return {id:request.id,uri:request.destination,downloadedNow:true,sizeBytes};
}

async function waitForNetworkGap(){const wait=Math.max(0,MIN_GAP_MS-(Date.now()-lastNetworkStartAt)); if(wait) await new Promise<void>((resolve)=>setTimeout(resolve,wait)); lastNetworkStartAt=Date.now();}

async function drain():Promise<void>{
  if(running)return;
  running=true;
  try{
    while(queue.length){
      queue.sort((a,b)=>(b.request.priority??0)-(a.request.priority??0));
      const item=queue.shift()!;
      try{await waitForNetworkGap(); item.resolve(await download(item.request));}catch(error){item.reject(error);}
    }
  }finally{running=false;}
}

export async function requestModelDownload(request:ModelDownloadRequest):Promise<ModelDownloadResult>{
  const activeOperation=active.get(request.id);
  if(activeOperation)return activeOperation;
  const operation=new Promise<ModelDownloadResult>((resolve,reject)=>{queue.push({request,resolve,reject});void drain();});
  active.set(request.id,operation);
  void operation.finally(()=>active.delete(request.id));
  return operation;
}

export async function isModelCached(id:string):Promise<boolean>{
  const index=await readIndex();
  const record=index[id];
  return !!record && await valid(record.uri,record.sizeBytes);
}

export async function clearModelCache(id:string):Promise<void>{
  const index=await readIndex();
  const record=index[id];
  if(record){try{await FileSystem.deleteAsync(record.uri,{idempotent:true});}catch{} delete index[id]; await writeIndex(index);}
}
