import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';

export type DownloadGateDeviceInfo = {
  appVersion?: string;
  platform?: string;
  osVersion?: string;
  deviceModel?: string;
  locale?: string;
};

type RpcResponse = {
  success?: boolean;
  reason?: string;
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const APP_DOWNLOAD_TOKEN = process.env.EXPO_PUBLIC_NEXUS_DOWNLOAD_TOKEN;

export class SupabaseDownloadDeniedError extends Error {
  readonly code = 'SUPABASE_DOWNLOAD_DENIED';
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseDownloadDeniedError';
  }
}

export async function getAppTokenSha256(): Promise<string> {
  if (!APP_DOWNLOAD_TOKEN) throw new Error('Voice download service is not configured.');
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, APP_DOWNLOAD_TOKEN);
}

async function callRpc<T>(name: string, body: Record<string, unknown>, accessToken: string): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase voice service is not configured.');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Supabase RPC ${name} failed (${response.status}).`);
  return response.json() as Promise<T>;
}

/**
 * Calls the Supabase RPC contract supplied by the app backend migration.
 * The app only orchestrates the gate; the database remains authoritative.
 */
export async function tryStartSupabaseVoiceDownload(
  userId: string,
  accessToken: string,
  deviceInfo?: DownloadGateDeviceInfo,
): Promise<void> {
  const tokenHash = await getAppTokenSha256();
  const result = await callRpc<RpcResponse>('try_start_download', {
    p_user_id: userId,
    p_app_token_sha256: tokenHash,
    p_device_info: deviceInfo ?? null,
  }, accessToken);

  if (!result?.success) {
    throw new SupabaseDownloadDeniedError(result?.reason || 'Voice download is temporarily unavailable.');
  }
}

export async function finishSupabaseVoiceDownload(userId: string, accessToken: string): Promise<void> {
  await callRpc('finish_download', { p_user_id: userId }, accessToken);
}
