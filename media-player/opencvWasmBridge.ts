export type OpenCvBridgeResult={
  initialized:boolean;
  description?:string;
  confidence?:number;
};

export type OpenCvWasmBridge={
  init:(scriptUri:string)=>Promise<void>;
  analyzeFrame:(rgba:Uint8Array,width:number,height:number,language:'hi'|'en')=>Promise<OpenCvBridgeResult>;
  dispose:()=>Promise<void>;
};

let bridge:OpenCvWasmBridge|null=null;

export function registerOpenCvWasmBridge(next:OpenCvWasmBridge){bridge=next;}
export function getOpenCvWasmBridge(){return bridge;}
