import * as FileSystem from 'expo-file-system';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
import { SUPABASE_URL } from '@/features/auth/authConfig';
import { getCustomElevenLabsApiKey } from '@/features/nexus-assistant/aiProviderPreferences';
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
  const personalKey = await getCustomElevenLabsApiKey();
  if (personalKey) {
    const response = await fetch('https://api.elevenlabs.io/v1/' + (body.action === 'list-voices' ? 'voices' : 'text-to-speech/' + encodeURIComponent(String(body.voiceId ?? ''))), {
      method: 'POST',
      headers: {
        'xi-api-key': personalKey,
        'Content-Type': 'application/json',
        Accept: body.action === 'list-voices' ? 'application/json' : 'audio/mpeg',
      },
      body: JSON.stringify(body.action === 'list-voices' ? {} : {
        text: body.text,
        model_id: body.modelId ?? 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        ...(body.languageCode ? { language_code: body.languageCode } : {}),
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(String(payload?.detail?.message ?? payload?.detail ?? 'ElevenLabs request failed.'));
    }
    if (body.action === 'list-voices') {
      const payload = await response.json();
      return { voices: (payload.voices ?? []).map((voice: any) => ({
        id: String(voice.voice_id),
        name: String(voice.name),
        category: String(voice.category ?? ''),
        description: String(voice.description ?? ''),
        language: String(voice.labels?.language ?? ''),
        gender: String(voice.labels?.gender ?? ''),
        previewUrl: voice.preview_url ?? null,
      })) } as T;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const audioUrl = 'data:audio/mpeg;base64,' + bytesToBase64(bytes);
    return { audioUrl, balance: 0, characters: String(body.text ?? '').length, creditsCharged: 0, cached: false } as T;
  }
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