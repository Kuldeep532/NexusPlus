import { NativeModules } from 'react-native';

export type UniversalTvKey =
  | 'POWER_ON' | 'POWER_OFF'
  | 'VOLUME_UP' | 'VOLUME_DOWN' | 'MUTE'
  | 'CHANNEL_UP' | 'CHANNEL_DOWN'
  | 'HOME' | 'BACK' | 'MENU'
  | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'OK'
  | 'PLAY_PAUSE' | 'REWIND' | 'FAST_FORWARD'
  | 'GUIDE' | 'INPUT' | 'VOICE_SEARCH'
  | 'NUMBER_0' | 'NUMBER_1' | 'NUMBER_2' | 'NUMBER_3' | 'NUMBER_4'
  | 'NUMBER_5' | 'NUMBER_6' | 'NUMBER_7' | 'NUMBER_8' | 'NUMBER_9'
  | 'CHANNEL_RETURN';

type UniversalTvNative = {\n  getReceiverStatus?: () => Promise<{ available: boolean; reason?: string }>;
  sendIrKey?: (key: UniversalTvKey) => Promise<boolean>;
  isIrAvailable?: () => Promise<boolean>;
  discoverWifiTvs?: () => Promise<Array<{ id: string; name: string; address?: string; brand?: string }>>;
};

const native = NativeModules.NexusTvRemote as UniversalTvNative | undefined;

export async function getUniversalTvReceiverStatus() {\n  if (!native?.getReceiverStatus) return { available: false, reason: 'TV receiver is not installed.' };\n  try { return await native.getReceiverStatus(); } catch { return { available: false, reason: 'TV receiver is not available.' }; }\n}\n\nexport async function sendUniversalTvKey(key: UniversalTvKey): Promise<boolean> {
  if (!native?.sendIrKey) {
    throw new Error('Universal TV key transport is not available on this device.');
  }
  return native.sendIrKey(key);
}

export async function isUniversalIrAvailable(): Promise<boolean> {
  if (!native?.isIrAvailable) return false;
  try {
    return Boolean(await native.isIrAvailable());
  } catch {
    return false;
  }
}

export async function discoverWifiTvs() {
  if (!native?.discoverWifiTvs) return [];
  try {
    return await native.discoverWifiTvs();
  } catch {
    return [];
  }
}
