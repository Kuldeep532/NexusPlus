import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { supabase } from '@/features/supabase/client';

export type VideoGenerationRequest = {
  prompt: string;
  model?: string;
  duration?: number;
  aspectRatio?: string;
};

export type VideoHistoryItem = {
  id: string;
  prompt: string;
  videoUrl: string;
  createdAt: number;
};

const HISTORY_KEY = 'nexus_plus_video_generator_history_v1';

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function generateRunwayVideo(request: VideoGenerationRequest) {
  const token = await getAccessToken();
  if (!token) throw new Error('SIGN_IN_REQUIRED');

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/runway-video-generate`,
    {
      method: 'POST',
      headers: {
        apikey: token,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.error === 'string' ? body.error : 'VIDEO_GENERATION_FAILED';
    throw new Error(message);
  }

  if (!body?.videoUrl) throw new Error('VIDEO_URL_MISSING');
  return String(body.videoUrl);
}

async function readHistory(): Promise<VideoHistoryItem[]> {
  const raw = await FileSystem.readAsStringAsync(
    `${FileSystem.documentDirectory}nexus-video-history.json`,
    { encoding: FileSystem.EncodingType.UTF8 },
  ).catch(() => null);
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
    `${FileSystem.documentDirectory}nexus-video-history.json`,
    JSON.stringify(items),
    { encoding: FileSystem.EncodingType.UTF8 },
  );
}

export async function addVideoHistory(item: Omit<VideoHistoryItem, 'id' | 'createdAt'>) {
  const items = await readHistory();
  items.unshift({ ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: Date.now() });
  await writeHistory(items.slice(0, 100));
}

export async function listVideoHistory() {
  return readHistory();
}

export async function clearVideoHistory() {
  await writeHistory([]);
}

export async function downloadGeneratedVideo(videoUrl: string, filename = `Nexus-Video-${Date.now()}.mp4`) {
  const target = `${FileSystem.cacheDirectory}${filename}`;
  const result = await FileSystem.downloadAsync(videoUrl, target);
  if (!result.uri) throw new Error('VIDEO_DOWNLOAD_FAILED');

  const permission = await MediaLibrary.requestPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('MEDIA_PERMISSION_REQUIRED');

  const asset = await MediaLibrary.createAssetAsync(result.uri);
  return asset.uri;
}
