import AsyncStorage from '@react-native-async-storage/async-storage';

export type EpaperLibraryItem = {
  id: string;
  title: string;
  localUri: string;
  extension: '.nxl' | '.pdf';
  status: 'LOCKED' | 'UNLOCKED' | 'EXPIRED' | 'TAMPERED';
  unlockTime?: string;
  printTime?: string;
  expiryTime?: string;
  sha256Hash?: string;
  serverId?: string;
  deviceBinding?: string;
  createdAt: string;
};

const LIBRARY_KEY = 'nexusplus.epaper.library.v1';

async function read(): Promise<EpaperLibraryItem[]> {
  const raw = await AsyncStorage.getItem(LIBRARY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function write(items: EpaperLibraryItem[]): Promise<void> {
  await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(items));
}

export async function upsertEpaperLibraryItem(item: EpaperLibraryItem): Promise<void> {
  const items = await read();
  const next = [item, ...items.filter((value) => value.id !== item.id)].slice(0, 500);
  await write(next);
}

export async function listEpaperLibraryItems(query = ''): Promise<EpaperLibraryItem[]> {
  const items = await read();
  const q = query.trim().toLocaleLowerCase();
  return q ? items.filter((item) => `${item.title} ${item.status} ${item.extension}`.toLocaleLowerCase().includes(q)) : items;
}

export async function removeEpaperLibraryItem(id: string): Promise<void> {
  await write((await read()).filter((item) => item.id !== id));
}

export async function refreshLocalLockState(now = new Date()): Promise<EpaperLibraryItem[]> {
  const items = await read();
  let changed = false;
  const next = items.map((item) => {
    if (!item.unlockTime || item.status === 'TAMPERED') return item;
    const current = now.getTime();
    const unlock = Date.parse(item.unlockTime);
    const expiry = item.expiryTime ? Date.parse(item.expiryTime) : Number.NaN;
    const status: EpaperLibraryItem['status'] = Number.isFinite(expiry) && current >= expiry
      ? 'EXPIRED'
      : current >= unlock
        ? 'UNLOCKED'
        : 'LOCKED';
    if (status !== item.status) {
      changed = true;
      return { ...item, status };
    }
    return item;
  });
  if (changed) await write(next);
  return next;
}
