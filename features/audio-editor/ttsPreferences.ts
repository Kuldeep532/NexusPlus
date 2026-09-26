import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseAccessToken, getStoredAuthSession } from '@/features/auth/supabaseAuthAdapter';
import { SUPABASE_URL } from '@/features/auth/authConfig';

export type TtsVoiceProvider = 'system' | 'piper' | 'clone' | 'elevenlabs';
export type TtsVoicePreferences = { provider: TtsVoiceProvider; voiceId: string; voiceName: string; language: string; };

const KEY = 'nexus-plus.tts-voice-preferences.v1';
const DEFAULTS: TtsVoicePreferences = { provider: 'system', voiceId: '', voiceName: 'System voice', language: '' };

function configured() { return Boolean(SUPABASE_URL); }
function headers(token: string) { return { apikey: token, Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' }; }

export async function readTtsVoicePreferences(): Promise<TtsVoicePreferences> {
  let local = DEFAULTS;
  try { const raw = await AsyncStorage.getItem(KEY); if (raw) local = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<TtsVoicePreferences>) }; } catch {}
  if (!configured()) return local;
  const token = await getSupabaseAccessToken();
  if (!token) return local;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tts_voice_preferences?select=provider,voice_id,voice_name,language&limit=1`, { headers: headers(token) });
    if (!response.ok) return local;
    const rows = await response.json() as Array<{provider:TtsVoiceProvider;voice_id:string|null;voice_name:string|null;language:string|null}>;
    const row = rows[0];
    if (!row) return local;
    const remote = { provider: row.provider, voiceId: row.voice_id ?? '', voiceName: row.voice_name ?? '', language: row.language ?? '' };
    await AsyncStorage.setItem(KEY, JSON.stringify(remote));
    return remote;
  } catch { return local; }
}

export async function saveTtsVoicePreferences(next: TtsVoicePreferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  if (!configured()) return;
  const token = await getSupabaseAccessToken();
  if (!token) return;
  const session = await getStoredAuthSession();
  if (!session?.user.uid) throw new Error('AUTH_REQUIRED');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/tts_voice_preferences`, {
    method: 'POST',
    headers: { ...headers(token), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: session.user.uid, provider: next.provider, voice_id: next.voiceId || null, voice_name: next.voiceName || null, language: next.language || null })
  });
  if (!response.ok) throw new Error('TTS_PREFERENCE_SAVE_FAILED');
}