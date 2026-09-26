import * as FileSystem from 'expo-file-system';

export type VideoHistoryItem = {
  id: string;
  prompt: string;
  videoUrl: string;
  createdAt: number;
};

const FILE = `${FileSystem.documentDirectory}nexus-video-history.json`;

async function read(): Promise<VideoHistoryItem[]> {
  const raw = await FileSystem.readAsStringAsync(FILE, { encoding: FileSystem.EncodingType.UTF8 }).catch(() => null);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function write(items: VideoHistoryItem[]) {
  await FileSystem.writeAsStringAsync(FILE, JSON.stringify(items.slice(0, 100)), { encoding: FileSystem.EncodingType.UTF8 });
}

export async function saveVideoHistory(prompt: string, videoUrl: string) {
  const items = await read();
  items.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    prompt,
    videoUrl,
    createdAt: Date.now(),
  });
  await write(items);
}

export const listVideoHistory = read;

export async function deleteVideoHistoryItem(id: string) {
  await write((await read()).filter(item => item.id !== id));
}

export async function clearVideoHistory() {
  await write([]);
}
