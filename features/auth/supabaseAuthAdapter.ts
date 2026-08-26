import * as SecureStore from 'expo-secure-store';
import { SUPABASE_URL } from './authConfig';
import type { AuthUserProfile, EmailPasswordInput } from './authTypes';
import type { SupabaseAuthAdapter } from './authRepository';

const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const SESSION_KEY = 'nexus-plus.supabase.session.v1';

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type SupabaseSessionResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  user: SupabaseUser;
};

function assertConfigured(): void {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error('SUPABASE_AUTH_NOT_CONFIGURED');
  }
}

function headers(accessToken?: string): Record<string, string> {
  assertConfigured();
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${accessToken ?? ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function parseError(response: Response): Promise<never> {
  let message = `SUPABASE_AUTH_ERROR_${response.status}`;
  try {
    const payload = await response.json();
    message = String(payload?.msg ?? payload?.message ?? payload?.error_description ?? payload?.error ?? message);
  } catch {
    // Keep the stable status-based error.
  }
  throw new Error(message);
}

async function requestSession(path: string, body: unknown): Promise<AuthSessionResponse> {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!response.ok) return parseError(response);
  return response.json() as Promise<AuthSessionResponse>;
}

function mapSession(response: SupabaseSessionResponse, fallbackProvider: 'google' | 'password') {
  const metadata = response.user.user_metadata ?? {};
  const displayName = String(metadata.full_name ?? metadata.name ?? '').trim();
  const photoUrl = metadata.avatar_url ?? metadata.picture ?? null;

  return {
    user: {
      uid: response.user.id,
      email: response.user.email ?? '',
      displayName,
      photoUrl: typeof photoUrl === 'string' ? photoUrl : null,
      provider: fallbackProvider,
    },
    idToken: response.access_token,
    expiresAt: response.expires_at ? response.expires_at * 1000 : Date.now() + (response.expires_in ?? 3600) * 1000,
  };
}

async function persistSession(response: SupabaseSessionResponse): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(response));
}

async function readStoredSession(): Promise<SupabaseSessionResponse | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    return raw ? JSON.parse(raw) as SupabaseSessionResponse : null;
  } catch {
    return null;
  }
}

export async function getStoredAuthSession() {
  const stored = await readStoredSession();
  if (!stored?.access_token || !stored.user?.id) return null;
  const provider = stored.user.user_metadata?.provider === 'email' ? 'password' : 'google';
  return mapSession(stored, provider);
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const stored = await readStoredSession();
  if (!stored?.access_token) return null;

  const expiresAt = stored.expires_at ? stored.expires_at * 1000 : 0;
  if (expiresAt > Date.now() + 60_000) return stored.access_token;
  if (!stored.refresh_token) return stored.access_token;

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ refresh_token: stored.refresh_token }),
    });
    if (!response.ok) return stored.access_token;
    const refreshed = await response.json() as SupabaseSessionResponse;
    await persistSession(refreshed);
    return refreshed.access_token;
  } catch {
    return stored.access_token;
  }
}

export const supabaseAuthAdapter: SupabaseAuthAdapter = {
  async signInWithGoogleIdToken(idToken: string) {
    const response = await requestSession('/auth/v1/token?grant_type=id_token', {
      provider: 'google',
      id_token: idToken,
    });
    await persistSession(response);
    return mapSession(response, 'google');
  },

  async signInWithEmailPassword(email: string, password: string) {
    const response = await requestSession('/auth/v1/token?grant_type=password', {
      email: email.trim(),
      password,
    });
    await persistSession(response);
    return mapSession(response, 'password');
  },

  async registerWithEmailPassword(input: EmailPasswordInput) {
    const response = await requestSession('/auth/v1/signup', {
      email: input.email.trim(),
      password: input.password,
      data: { full_name: input.name.trim() },
    });
    await persistSession(response);
    return mapSession(response, 'password');
  },

  async upsertProfile(_profile: AuthUserProfile) {
    // The Supabase auth user metadata is the canonical lightweight profile.
    // Feature-specific profile tables can be added behind a secure RPC later.
    return undefined;
  },

  async signOut() {
    const token = await getSupabaseAccessToken();
    if (token && ANON_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: headers(token),
        });
      } catch {
        // Local session is still cleared even if the network is unavailable.
      }
    }
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};

export function validateEmailPasswordInput(input: EmailPasswordInput): void {
  if (input.name.trim().length < 1 || input.name.trim().length > 80) {
    throw new Error('Name must be between 1 and 80 characters.');
  }
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) {
    throw new Error('Please enter a valid email address.');
  }
  if (input.password.length < 8) {
    throw new Error('Password must contain at least 8 characters.');
  }
}

export type AuthSessionResponse = SupabaseSessionResponse;
