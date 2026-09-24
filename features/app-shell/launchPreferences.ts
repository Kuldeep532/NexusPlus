import AsyncStorage from '@react-native-async-storage/async-storage';
const STORAGE_KEY='@nexus-plus/launch-preferences';
const MODE_PROMPT_KEY='@nexus-plus/app-mode-prompted';
export type HomeDestination='nexus-home'|'geeta-home'|'spiritual-home';
export type LaunchPreferences={launchTarget:'nexus-plus';homeDestination:HomeDestination;showGeetaNexusOnHome:boolean;};
const DEFAULT_PREFERENCES:LaunchPreferences={launchTarget:'nexus-plus',homeDestination:'nexus-home',showGeetaNexusOnHome:true};
export async function readLaunchPreferences():Promise<LaunchPreferences>{try{const raw=await AsyncStorage.getItem(STORAGE_KEY);if(!raw)return DEFAULT_PREFERENCES;const v=JSON.parse(raw) as Partial<LaunchPreferences>;return{launchTarget:'nexus-plus',homeDestination:v.homeDestination==='spiritual-home'?'spiritual-home':v.homeDestination==='geeta-home'?'geeta-home':'nexus-home',showGeetaNexusOnHome:v.showGeetaNexusOnHome!==false}}catch{return DEFAULT_PREFERENCES}}
export async function writeLaunchPreferences(next:LaunchPreferences){await AsyncStorage.setItem(STORAGE_KEY,JSON.stringify({launchTarget:'nexus-plus',homeDestination:next.homeDestination,showGeetaNexusOnHome:next.showGeetaNexusOnHome===true,showDiscoverOnHome:false}))}
export async function hasPromptedForAppMode(){return(await AsyncStorage.getItem(MODE_PROMPT_KEY))==='true'}
export async function markAppModePrompted(){await AsyncStorage.setItem(MODE_PROMPT_KEY,'true')}
