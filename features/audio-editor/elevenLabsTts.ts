import * as FileSystem from 'expo-file-system';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
import { SUPABASE_URL } from '@/features/auth/authConfig';
import { File, Directory, Paths } from 'expo-file-system';

export type ElevenLabsVoice = {
  id: string;
  name: string;
  category: string;
  description: string;
  language: string;
  gender: string;
  previewUrl?: string | null;
};

type TtsApiResponse = {
  error?: string;
  voices?: ElevenLabsVoice[];
  audioUrl?: string;
  balance?: number;
  characters?: number;
  creditsCharged?: number;
  cached?: boolean;
};

const OUTPUT_DIR = new Directory(Paths.cache, 'nexus-elevenlabs');
OUTPUT_DIR.create({ intermediates: true, idempotent: true });

function assertConfigured() {
  if (!SUPABASE_URL) throw new Error('SUPABASE_NOT_CONFIGURED');
}

async function request<T extends TtsApiResponse>(body: Record<string, unknown>): Promise<T> {
  assertConfigured();
  const token = await getSupabaseAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');
  const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
    method: 'POST',
    headers: {
      apikey: token,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({} as T));
  if (!response.ok) {
    const code = String((payload as T).error ?? `ELEVENLABS_REQUEST_${response.status}`);
    if (response.status === 402 || code === 'INSUFFICIENT_CREDITS') throw new Error('INSUFFICIENT_CREDITS');
    throw new Error(code);
  }
  return payload as T;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunkSize, bytes.length)));
  }
  return globalThis.btoa(binary);
}

export async function listElevenLabsVoices(): Promise<ElevenLabsVoice[]> {
  const result = await request<{ voices?: ElevenLabsVoice[] }>({ action: 'list-voices' });
  return result.voices ?? [];
}

export async function generateWithElevenLabs(params: {
  text: string;
  voiceId: string;
  modelId?: string;
  languageCode?: string;
}): Promise<{ outputUri: string; balance: number; creditsCharged: number; characters: number; cached: boolean }> {
  const normalized = params.text.trim();
  if (!normalized) throw new Error('Enter text before generating speech.');
  if (!params.voiceId) throw new Error('Select an ElevenLabs voice first.');
  const result = await request<TtsApiResponse>({
    action: 'synthesize',
    text: normalized,
    voiceId: params.voiceId,
    modelId: params.modelId ?? 'eleven_multilingual_v2',
    ...(params.languageCode ? { languageCode: params.languageCode } : {}),
  });
  if (!result.audioUrl) throw new Error('TTS_AUDIO_URL_FAILED');
  const response = await fetch(result.audioUrl);
  if (!response.ok) throw new Error('TTS_AUDIO_DOWNLOAD_FAILED');
  const bytes = new Uint8Array(await response.arrayBuffer());
  const output = new File(OUTPUT_DIR, `elevenlabs-${Date.now()}.mp3`);
  try {
    await FileSystem.writeAsStringAsync(output.uri, bytesToBase64(bytes), { encoding: FileSystem.EncodingType.Base64 });
  } catch {
    throw new Error('TTS_AUDIO_SAVE_FAILED');
  }
  return {
    outputUri: output.uri,
    balance: Number(result.balance ?? 0),
    creditsCharged: Number(result.creditsCharged ?? 0),
    characters: Number(result.characters ?? normalized.length),
    cached: Boolean(result.cached),
  };
}