import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MirrorSession } from './screenMirrorTypes';

const KEY = 'nexus-plus.screen-mirroring.session.v1';

export async function getMirrorSession(): Promise<MirrorSession | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as MirrorSession : null;
  } catch {
    return null;
  }
}

export async function saveMirrorSession(session: MirrorSession | null): Promise<void> {
  if (!session) {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
}
