import AsyncStorage from '@react-native-async-storage/async-storage';

export type MediaSort = 'name' | 'date' | 'duration';
export type MediaBrowserPreferences = {
  sort: MediaSort;
  descending: boolean;
  compactGrid: boolean;
};

const KEY='@nexus-plus/media-browser-preferences';
export const DEFAULT_MEDIA_BROWSER_PREFERENCES: MediaBrowserPreferences = {
  sort:'name',
  descending:false,
  compactGrid:false,
};

export async function readMediaBrowserPreferences():Promise<MediaBrowserPreferences>{
  try{
    const raw=await AsyncStorage.getItem(KEY);
    if(!raw) return DEFAULT_MEDIA_BROWSER_PREFERENCES;
    const p=JSON.parse(raw) as Partial<MediaBrowserPreferences>;
    return {...DEFAULT_MEDIA_BROWSER_PREFERENCES,...p};
  }catch{return DEFAULT_MEDIA_BROWSER_PREFERENCES;}
}

export async function writeMediaBrowserPreferences(next:MediaBrowserPreferences):Promise<void>{
  await AsyncStorage.setItem(KEY,JSON.stringify(next));
}
