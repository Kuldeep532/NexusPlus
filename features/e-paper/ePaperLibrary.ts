import AsyncStorage from '@react-native-async-storage/async-storage';

export type EpaperLibraryKind = 'general' | 'exam';

export type EpaperLibraryItem = {
  id: string;
  title: string;
  localUri: string;
  extension: '.nxl' | '.pdf';
  kind: EpaperLibraryKind;
  status: 'LOCKED' | 'UNLOCKED' | 'EXPIRED' | 'TAMPERED';
  unlockTime?: string;
  printTime?: string;
  expiryTime?: string;
  sha256Hash?: string;
  serverId?: string;
  deviceBinding?: string;
  createdAt: string;
  updatedAt?: string;
};

const LIBRARY_KEY = 'nexusplus.epaper.library.v2';

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
  const now = new Date().toISOString();
  const nextItem = { ...item, updatedAt: item.updatedAt || now };
  const items = await read();
  const next = [nextItem, ...items.filter((value) => value.id !== item.id)].slice(0, 500);
  await write(next);
}

export async function listEpaperLibraryItems(query = '', kind?: EpaperLibraryKind): Promise<EpaperLibraryItem[]> {
  const items = await read();
  const q = query.trim().toLocaleLowerCase();
  return items.filter((item) => {
    if (kind && item.kind !== kind) return false;
    if (!q) return true;
    return `${item.title} ${item.status} ${item.extension} ${item.kind}`.toLocaleLowerCase().includes(q);
  });
}

export async function removeEpaperLibraryItem(id: string): Promise<void> {
  await write((await read()).filter((item) => item.id !== id));
}

export async function refreshLocalLockState(now = new Date()): Promise<EpaperLibraryItem[]> {
  const items = await read();
  let changed = false;
  const next = items.map((item) => {
    if (item.kind !== 'exam' || !item.unlockTime || item.status === 'TAMPERED') return item;
    const current = now.getTime();
    const unlock = Date.parse(item.unlockTime);
    const expiry = item.expiryTime ? Date.parse(item.expiryTime) : Number.NaN;
    const status: EpaperLibraryItem['status'] = Number.isFinite(expiry) && current >= expiry
      ? 'EXPIRED'
      : Number.isFinite(unlock) && current >= unlock
        ? 'UNLOCKED'
        : 'LOCKED';
    if (status !== item.status) {
      changed = true;
      return { ...item, status, updatedAt: now.toISOString() };
    }
    return item;
  });
  if (changed) await write(next);
  return next;
}

export async function findEpaperLibraryItem(id: string): Promise<EpaperLibraryItem | undefined> {
  return (await read()).find((item) => item.id === id);
}
