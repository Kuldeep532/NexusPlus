import { SUPABASE_URL } from './authConfig';
import type { AuthSession } from './authTypes';

export interface DeviceSecurityVerdict {
  deviceHash: string;
  integrityVerdict: string;
}

export type SupabaseSecurityErrorCode =
  | 'DEVICE_ALREADY_LINKED'
  | 'ACCOUNT_ALREADY_LINKED'
  | 'ACCOUNT_BLOCKED'
  | 'DELETION_COOLDOWN'
  | 'AUTH_REQUIRED'
  | 'SERVER_REJECTED'
  | 'NOT_CONFIGURED';

export class SupabaseSecurityError extends Error {
  constructor(public readonly code: SupabaseSecurityErrorCode, message: string) {
    super(message);
    this.name = 'SupabaseSecurityError';
  }
}

function getSupabaseAnonKey(): string | null {
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return key || null;
}

export async function linkAuthenticatedDevice(
  session: AuthSession,
  security: DeviceSecurityVerdict,
): Promise<void> {
  const anonKey = getSupabaseAnonKey();
  if (!anonKey || !SUPABASE_URL) {
    throw new SupabaseSecurityError('NOT_CONFIGURED', 'Secure account verification is not configured.');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_device_for_user`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${session.idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_device_hash: security.deviceHash,
      p_integrity_verdict: security.integrityVerdict,
    }),
  });

  if (response.ok) return;

  let message = 'The secure account verification server rejected this sign-in.';
  try {
    const payload = await response.json();
    const text = `${payload?.message ?? ''} ${payload?.hint ?? ''}`.toLowerCase();
    if (text.includes('already linked to another account')) {
      throw new SupabaseSecurityError('DEVICE_ALREADY_LINKED', message);
    }
    if (text.includes('already linked to another device')) {
      throw new SupabaseSecurityError('ACCOUNT_ALREADY_LINKED', message);
    }
    if (text.includes('cooldown')) {
      throw new SupabaseSecurityError('DELETION_COOLDOWN', message);
    }
    if (text.includes('blocked')) {
      throw new SupabaseSecurityError('ACCOUNT_BLOCKED', message);
    }
  } catch (error) {
    if (error instanceof SupabaseSecurityError) throw error;
  }

  throw new SupabaseSecurityError('SERVER_REJECTED', message);
}
