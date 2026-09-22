import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY='@nexus-plus/weather-location-v1';

export type WeatherLocationPreference={
  mode:'device'|'manual';
  latitude?:number;
  longitude?:number;
  label?:string;
};

export const DEFAULT_WEATHER_LOCATION:WeatherLocationPreference={mode:'device'};

export async function readWeatherLocationPreference():Promise<WeatherLocationPreference>{
  try{const raw=await AsyncStorage.getItem(KEY); if(!raw)return DEFAULT_WEATHER_LOCATION; const value=JSON.parse(raw) as Partial<WeatherLocationPreference>; return {...DEFAULT_WEATHER_LOCATION,...value};}catch{return DEFAULT_WEATHER_LOCATION;}
}
export async function writeWeatherLocationPreference(next:WeatherLocationPreference):Promise<void>{await AsyncStorage.setItem(KEY,JSON.stringify(next));}
