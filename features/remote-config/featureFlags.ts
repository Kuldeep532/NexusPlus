import { SUPABASE_URL } from '@/features/auth/authConfig';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
export type NexusFeatureCode='nexus_discover'|'nexus_assist'|'audio_editor'|'voice_studio'|'pdf_tools'|'secure_vault'|'cctv'|'file_transfer';
export type NexusFeatureFlag={feature_code:NexusFeatureCode;feature_name:string;enabled:boolean;min_tier:1|2|3;message_when_disabled:string|null};

const KEY=(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim()??'';
const cache=new Map<NexusFeatureCode,NexusFeatureFlag>(); let loadedAt=0; const CACHE_TTL_MS=60_000;

function publicHeaders(token?:string):Record<string,string>{return{apikey:KEY,Authorization:'Bearer '+(token??KEY),Accept:'application/json'};}

export async function refreshNexusFeatureFlags(force=false):Promise<NexusFeatureFlag[]>{
 if(!SUPABASE_URL||!KEY)return Array.from(cache.values());
 if(!force&&loadedAt&&Date.now()-loadedAt<CACHE_TTL_MS&&cache.size)return Array.from(cache.values());
 try{const response=await fetch(SUPABASE_URL+'/rest/v1/app_feature_flags?select=feature_code,feature_name,enabled,min_tier,message_when_disabled',{headers:publicHeaders()});if(!response.ok)return Array.from(cache.values());const rows=await response.json() as NexusFeatureFlag[];for(const row of rows)cache.set(row.feature_code,row);loadedAt=Date.now();return rows;}catch{return Array.from(cache.values());}
}

export async function getNexusFeatureAccess(featureCode:NexusFeatureCode,userTier=1):Promise<{enabled:boolean;message?:string}>{
 const flags=await refreshNexusFeatureFlags(); const flag=flags.find(item=>item.feature_code===featureCode);
 if(flag&&!flag.enabled)return{enabled:false,message:flag.message_when_disabled||'This feature is temporarily unavailable. Please try again later.'};
 try{
  const token=await getSupabaseAccessToken();
  if(!token)return flag&&userTier<flag.min_tier?{enabled:false,message:flag.message_when_disabled||'This feature is available with a higher membership plan.'}:{enabled:true};
  const response=await fetch(SUPABASE_URL+'/rest/v1/premium_feature_catalog?select=feature_code,access_type,min_tier,is_active&feature_code=eq.'+encodeURIComponent(featureCode),{headers:publicHeaders(token)});
  if(response.ok){const rows=await response.json() as Array<{feature_code:string;access_type:'FREE'|'CREDIT_BASED'|'PREMIUM_ONLY';min_tier:number;is_active:boolean}>;const live=rows[0];if(live&&!live.is_active)return{enabled:false,message:'This feature is temporarily unavailable. Please try again later.'};if(live&&(live.access_type==='PREMIUM_ONLY'||live.min_tier>1)&&userTier<live.min_tier)return{enabled:false,message:'This feature is available with a higher membership plan.'};}
 }catch{}
 if(flag&&userTier<flag.min_tier)return{enabled:false,message:flag.message_when_disabled||'This feature is available with a higher membership plan.'};
 return{enabled:true};
}
export function clearNexusFeatureFlagCache():void{cache.clear();loadedAt=0;}
