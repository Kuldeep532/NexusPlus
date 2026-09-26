import AsyncStorage from '@react-native-async-storage/async-storage';

export type HistorySettings = {
  video: boolean;
  assistant: boolean;
};

const KEY = 'nexus-plus-history-settings-v1';
const DEFAULTS: HistorySettings = { video: true, assistant: true };

export async function getHistorySettings(): Promise<HistorySettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULTS;
  try { return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<HistorySettings>) }; }
  catch { return DEFAULTS; }
}

export async function setHistorySettings(next: HistorySettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
