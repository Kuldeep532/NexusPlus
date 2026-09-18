import { NativeModules } from 'react-native';

type TvInput = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'OK' | 'BACK' | 'HOME' | 'MENU' | 'PLAY_PAUSE' | 'VOLUME_UP' | 'VOLUME_DOWN' | 'MUTE' | 'CHANNEL_UP' | 'CHANNEL_DOWN' | 'POWER_ON' | 'POWER_OFF' | 'GUIDE' | 'INPUT' | 'VOICE_SEARCH' | 'SCROLL_UP' | 'SCROLL_DOWN';

type TvRemoteNative = {
  sendKey?: (key: TvInput) => Promise<boolean>;
  isAvailable?: () => Promise<boolean>;
  getSessionDevice?: () => Promise<Record<string, unknown>>;
};

const native = NativeModules.NexusTvRemote as TvRemoteNative | undefined;

export async function sendTvInput(key: TvInput): Promise<boolean> {
  if (!native?.sendKey) throw new Error('TV remote transport is not available in this Android build.');
  return native.sendKey(key);
}

export async function isTvRemoteAvailable(): Promise<boolean> {
  if (!native?.isAvailable) return false;
  try { return Boolean(await native.isAvailable()); } catch { return false; }
}

export async function getTvSessionDevice(): Promise<Record<string, unknown> | null> {
  if (!native?.getSessionDevice) return null;
  try { return await native.getSessionDevice(); } catch { return null; }
}
