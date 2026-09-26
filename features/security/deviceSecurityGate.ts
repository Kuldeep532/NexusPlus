import { NativeModules, Platform } from 'react-native';
import { evaluateDeviceIntegrity, type DeviceIntegrityVerdict, type DeviceSecurityState } from './deviceSecurityPolicy';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
import { APP_API_BASE_URL } from '@/features/api-gateway/apiGatewayClient';

interface NativeIntegrityModule {
  requestIntegrityToken(requestHash: string): Promise<string>;
}

const nativeIntegrity = NativeModules.NexusIntegrity as NativeIntegrityModule | undefined;

export async function requestDeviceIntegrityToken(requestHash: string): Promise<string | null> {
  if (Platform.OS !== 'android' || !nativeIntegrity) return null;
  try {
    return await nativeIntegrity.requestIntegrityToken(requestHash);
  } catch {
    return null;
  }
}

export async function submitIntegrityToken(token: string, requestHash: string): Promise<void> {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken || !APP_API_BASE_URL || !token) return;

  await fetch(APP_API_BASE_URL + '/security/attest-token', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      token,
      requestHash,
      packageName: 'com.nexuswavetech.nexusplus',
      appId: 'nexus-plus-android',
    }),
  }).then(async (response) => {
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(String(payload?.error ?? 'APP_INTEGRITY_NOT_VERIFIED'));
    }
  });
}

export function evaluateVerifiedIntegrity(verdict: DeviceIntegrityVerdict): DeviceSecurityState {
  return evaluateDeviceIntegrity(verdict);
}
