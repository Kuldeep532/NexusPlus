import AsyncStorage from '@react-native-async-storage/async-storage';

export type LinkShortcut = {
  id: string;
  title: string;
  url: string;
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = 'nexus-plus.link-shortcuts.v1';

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Link is required.');
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error('Enter a valid web link.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS links are supported.');
  }
  return parsed.toString();
}

export async function listLinkShortcuts(): Promise<LinkShortcut[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLinkShortcut).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function addLinkShortcut(title: string, url: string): Promise<LinkShortcut> {
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error('Shortcut name is required.');
  const normalizedUrl = normalizeUrl(url);
  const now = Date.now();
  const shortcut: LinkShortcut = { id: `${now}-${Math.random().toString(36).slice(2, 8)}`, title: cleanTitle, url: normalizedUrl, createdAt: now, updatedAt: now };
  const current = await listLinkShortcuts();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([shortcut, ...current]));
  return shortcut;
}

export async function deleteLinkShortcut(id: string): Promise<void> {
  const current = await listLinkShortcuts();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter((item) => item.id !== id)));
}

function isLinkShortcut(value: unknown): value is LinkShortcut {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<LinkShortcut>;
  return typeof item.id === 'string' && typeof item.title === 'string' && typeof item.url === 'string' && typeof item.createdAt === 'number' && typeof item.updatedAt === 'number';
}
