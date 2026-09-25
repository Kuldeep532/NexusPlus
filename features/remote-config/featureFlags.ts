import { SUPABASE_URL } from '@/features/auth/authConfig';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';

export type NexusFeatureCode =
  | 'nexus_discover'
  | 'nexus_assist'
  | 'audio_editor'
  | 'voice_studio'
  | 'pdf_tools'
  | 'secure_vault'
  | 'cctv'
  | 'file_transfer';

export type NexusFeatureFlag = {
  feature_code: NexusFeatureCode;
  feature_name: string;
  enabled: boolean;
  min_tier: 1 | 2 | 3;
  message_when_disabled: string | null;
};

const KEY = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '';
const cache = new Map<NexusFeatureCode, NexusFeatureFlag>();
let loadedAt = 0;
const CACHE_TTL_MS = 60_000;

function publicHeaders(): Record<string,string> {
  return {
    apikey: KEY,
    Authorization: 'Bearer ' + KEY,
    Accept: 'application/json',
  };
}

export async function refreshNexusFeatureFlags(force = false): Promise<NexusFeatureFlag[]> {
  if (!SUPABASE_URL || !KEY) return Array.from(cache.values());
  if (!force && loadedAt && Date.now() - loadedAt < CACHE_TTL_MS && cache.size) return Array.from(cache.values());

  try {
    const response = await fetch(
      SUPABASE_URL + '/rest/v1/app_feature_flags?select=feature_code,feature_name,enabled,min_tier,message_when_disabled',
      { headers: publicHeaders() },
    );
    if (!response.ok) return Array.from(cache.values());

    const rows = await response.json() as NexusFeatureFlag[];
    for (const row of rows) cache.set(row.feature_code, row);
    loadedAt = Date.now();
    return rows;
  } catch {
    return Array.from(cache.values());
  }
}

export async function getNexusFeatureAccess(
  featureCode: NexusFeatureCode,
  userTier = 1,
): Promise<{ enabled: boolean; message?: string }> {
  const flags = await refreshNexusFeatureFlags();
  const flag = flags.find((item) => item.feature_code === featureCode);
  if (!flag) return { enabled: true };
  if (!flag.enabled) {
    return {
      enabled: false,
      message: flag.message_when_disabled || `${flag.feature_name} is temporarily unavailable. Please try again later.`,
    };
  }
  if (userTier < flag.min_tier) {
    return {
      enabled: false,
      message: flag.message_when_disabled || `${flag.feature_name} is available with a higher membership plan.`,
    };
  }
  return { enabled: true };
}

export function clearNexusFeatureFlagCache(): void {
  cache.clear();
  loadedAt = 0;
}
