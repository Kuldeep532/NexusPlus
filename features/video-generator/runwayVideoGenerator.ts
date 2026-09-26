import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
const HISTORY_FILE = `${FileSystem.documentDirectory}nexus-video-history.json`;

export type VideoGenerationRequest = {
  prompt: string;
  model?: 'gen4_turbo' | 'gen4.5';
  duration?: number;
  aspectRatio?: string;
};

export type VideoGenerationResult = {
  videoUrl: string;
  taskId?: string;
  creditsCharged?: number;
  model?: string;
  duration?: number;
  ratio?: string;
};

export type VideoHistoryItem = {
  id: string;
  prompt: string;
  videoUrl: string;
  createdAt: number;
  model?: string;
  duration?: number;
};

export async function generateRunwayVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
  const token = await getSupabaseAccessToken();
  if (!token || !SUPABASE_URL) throw new Error('SIGN_IN_REQUIRED');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/runway-video-generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'VIDEO_GENERATION_FAILED');
  }
  if (!body?.videoUrl) throw new Error('VIDEO_URL_MISSING');

  return {
    videoUrl: String(body.videoUrl),
    taskId: typeof body.taskId === 'string' ? body.taskId : undefined,
    creditsCharged: Number.isFinite(Number(body.creditsCharged)) ? Number(body.creditsCharged) : undefined,
    model: typeof body.model === 'string' ? body.model : undefined,
    duration: Number.isFinite(Number(body.duration)) ? Number(body.duration) : undefined,
    ratio: typeof body.ratio === 'string' ? body.ratio : undefined,
  };
}

async function readHistory(): Promise<VideoHistoryItem[]> {
  const raw = await FileSystem.readAsStringAsync(HISTORY_FILE, {
    encoding: FileSystem.EncodingType.UTF8,
  }).catch(() => null);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeHistory(items: VideoHistoryItem[]) {
  await FileSystem.writeAsStringAsync(
    HISTORY_FILE,
    JSON.stringify(items.slice(0, 100)),
    { encoding: FileSystem.EncodingType.UTF8 },
  );
}

export async function saveVideoHistory(
  prompt: string,
  videoUrl: string,
  metadata: Pick<VideoHistoryItem, 'model' | 'duration'> = {},
) {
  const items = await readHistory();
  items.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    prompt,
    videoUrl,
    createdAt: Date.now(),
    ...metadata,
  });
  await writeHistory(items);
}

export async function listVideoHistory() {
  return readHistory();
}

export async function deleteVideoHistoryItem(id: string) {
  await writeHistory((await readHistory()).filter(item => item.id !== id));
}

export async function clearVideoHistory() {
  await writeHistory([]);
}

export async function downloadGeneratedVideo(
  videoUrl: string,
  filename = `Nexus-Video-${Date.now()}.mp4`,
) {
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) throw new Error('VIDEO_STORAGE_UNAVAILABLE');

  const result = await FileSystem.downloadAsync(videoUrl, `${base}${filename}`);
  if (!result.uri) throw new Error('VIDEO_DOWNLOAD_FAILED');

  const permission = await MediaLibrary.requestPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('MEDIA_PERMISSION_REQUIRED');

  return (await MediaLibrary.createAssetAsync(result.uri)).uri;
}
