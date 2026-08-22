import { getAuthFailureMessage, type AuthFailureCode } from './authFailure';
import type { AuthSession } from './authTypes';
import { getDurableDeviceHash, getSecurityState } from './deviceSecurity';
import { linkAuthenticatedDevice, SupabaseSecurityError } from './supabaseSecurity';

export class SecureAuthGateError extends Error {
  constructor(public readonly code: AuthFailureCode, message?: string) {
    super(message ?? getAuthFailureMessage(code));
    this.name = 'SecureAuthGateError';
  }
}

export async function verifyAuthSessionSecurity(session: AuthSession): Promise<void> {
  const state = await getSecurityState();
  if (!state.integrityAvailable || !state.licensedInstall || !state.playRecognized) {
    throw new SecureAuthGateError(
      state.licensedInstall ? 'DEVICE_INTEGRITY_FAILED' : 'UNVERIFIED_INSTALL',
    );
  }

  if (state.deviceRecall === 'UNKNOWN_NEW_DEVICE') {
    throw new SecureAuthGateError('DEVICE_INTEGRITY_FAILED');
  }

  const deviceHash = await getDurableDeviceHash();
  try {
    await linkAuthenticatedDevice(session, {
      deviceHash,
      integrityVerdict: state.deviceRecall,
    });
  } catch (error) {
    if (error instanceof SupabaseSecurityError) {
      const map: Partial<Record<SupabaseSecurityError['code'], AuthFailureCode>> = {
        DEVICE_ALREADY_LINKED: 'DEVICE_ALREADY_LINKED',
        ACCOUNT_ALREADY_LINKED: 'ACCOUNT_ALREADY_LINKED',
        ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
        DELETION_COOLDOWN: 'DELETION_COOLDOWN',
      };
      throw new SecureAuthGateError(map[error.code] ?? 'AUTH_UNKNOWN');
    }
    throw new SecureAuthGateError('SUPABASE_NOT_CONFIGURED');
  }
}
