import { SUPABASE_URL } from '@/features/auth/authConfig';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';

export type AudioDescriptionMode = 'basic' | 'advanced';
export type AudioDescriptionRequest = {
  uri: string;
  mimeType?: string;
  language: string;
  mode: AudioDescriptionMode;
  customInstruction?: string;
  durationSeconds?: number;
};
export type AudioDescriptionResult = {
  description: string;
  provider: 'gemini';
  mode: AudioDescriptionMode;
  creditsCharged: number;
};

function guessMime(uri: string, mimeType?: string): string {
  if (mimeType?.startsWith('video/')) return mimeType;
  const ext = uri.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
  return ({mp4:'video/mp4',mov:'video/quicktime',m4v:'video/x-m4v',webm:'video/webm',avi:'video/x-msvideo',mkv:'video/x-matroska',mpeg:'video/mpeg',mpg:'video/mpeg',wmv:'video/x-ms-wmv','3gp':'video/3gpp'} as Record<string,string>)[ext ?? ''] ?? 'video/mp4';
}

async function uploadVideoToPrivateStorage(uri: string, mimeType: string, token: string): Promise<string> {
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!userResponse.ok) throw new Error('AUTH_REQUIRED');
  const user = await userResponse.json() as { id?: string };
  if (!user.id) throw new Error('AUTH_REQUIRED');

  const blobResponse = await fetch(uri);
  if (!blobResponse.ok) throw new Error('VIDEO_UPLOAD_FAILED');
  const blob = await blobResponse.blob();
  const extension = mimeType.split('/')[1]?.replace('x-', '') || 'mp4';
  const objectPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const upload = await fetch(`${SUPABASE_URL}/storage/v1/object/audio-description/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '',
      Authorization: `Bearer ${token}`,
      'Content-Type': mimeType,
      'x-upsert': 'false',
    },
    body: blob,
  });
  if (!upload.ok) throw new Error('VIDEO_UPLOAD_FAILED');
  return objectPath;
}

export async function createAudioDescription(input: AudioDescriptionRequest): Promise<AudioDescriptionResult> {
  const mimeType = guessMime(input.uri, input.mimeType);
  if (!mimeType.startsWith('video/')) throw new Error('VIDEO_MIME_TYPE_REQUIRED');

  const token = await getSupabaseAccessToken();
  if (!token || !SUPABASE_URL) throw new Error('AUTH_REQUIRED');

  let storagePath = '';
  try {
    storagePath = await uploadVideoToPrivateStorage(input.uri, mimeType, token);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/nexus-audio-description`, {
      method: 'POST',
      headers: {
        apikey: (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storageBucket: 'audio-description',
        storagePath,
        mimeType,
        language: input.language,
        mode: input.mode,
        customInstruction: input.customInstruction,
        durationSeconds: input.durationSeconds,
      }),
    });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) throw new Error(String(payload?.error ?? 'AUDIO_DESCRIPTION_FAILED'));
    const description = [payload.output_text,payload.text,payload.description]
      .find((v): v is string => typeof v === 'string' && v.trim().length > 0)?.trim();
    if (!description) throw new Error('AUDIO_DESCRIPTION_EMPTY');
    return {
      description,
      provider: 'gemini',
      mode: input.mode,
      creditsCharged: Number(payload.creditsCharged ?? (input.mode === 'advanced' ? 12 : 0)),
    };
  } catch (error) {
    throw error;
  }
}