import * as SecureStore from 'expo-secure-store';
import { SUPABASE_URL } from './authConfig';

const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const SESSION_KEY = 'nexus-plus.supabase.session.v1';

function assertConfigured(): void {
  if (!SUPABASE_URL || !ANON_KEY) throw new Error('SUPABASE_AUTH_NOT_CONFIGURED');
}

export async function deleteNexusPlusAccount(): Promise<void> {
  assertConfigured();
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) throw new Error('ACCOUNT_SESSION_NOT_FOUND');

  let session: { access_token?: string; user?: { id?: string } };
  try {
    session = JSON.parse(raw) as typeof session;
  } catch {
    throw new Error('ACCOUNT_SESSION_INVALID');
  }

  if (!session.access_token || !session.user?.id) throw new Error('ACCOUNT_SESSION_INVALID');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/delete_current_user`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  if (!response.ok) {
    let message = `ACCOUNT_DELETE_FAILED_${response.status}`;
    try {
      const payload = await response.json();
      message = String(payload?.message ?? payload?.msg ?? payload?.hint ?? message);
    } catch {
      // Keep stable status-based error.
    }
    throw new Error(message);
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}
