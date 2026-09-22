import AsyncStorage from '@react-native-async-storage/async-storage';

export type GreetingMode = 'radhe-radhe' | 'jai-shri-krishna' | 'hare-krishna' | 'good-day' | 'namaste' | 'hari-om' | 'shri-radhe' | 'govinda' | 'time-aware';

const KEY='@nexus-plus/greeting-preferences-v1';
export type GreetingPreferences={mode:GreetingMode};
export const DEFAULT_GREETING_PREFERENCES:GreetingPreferences={mode:'radhe-radhe'};

export async function readGreetingPreferences():Promise<GreetingPreferences>{
  try{const raw=await AsyncStorage.getItem(KEY); if(!raw)return DEFAULT_GREETING_PREFERENCES; const value=JSON.parse(raw) as Partial<GreetingPreferences>; return {mode:value.mode||'radhe-radhe'};}catch{return DEFAULT_GREETING_PREFERENCES;}
}
export async function writeGreetingPreferences(next:GreetingPreferences):Promise<void>{await AsyncStorage.setItem(KEY,JSON.stringify(next));}

export function getGreetingText(mode:GreetingMode,date=new Date()):string{
  if(mode==='time-aware'){
    const hour=date.getHours();
    if(hour<12)return 'Good Morning';
    if(hour<18)return 'Radhe Radhe';
    return 'Good Night';
  }
  const map:Record<Exclude<GreetingMode,'time-aware'>,string>={
    'radhe-radhe':'Radhe Radhe',
    'jai-shri-krishna':'Jai Shri Krishna',
    'hare-krishna':'Hare Krishna',
    'good-day':'Good Morning',
    'namaste':'Namaste',
    'hari-om':'Hari Om',
    'shri-radhe':'Shri Radhe',
    'govinda':'Hare Govinda',
  };
  return map[mode];
}
