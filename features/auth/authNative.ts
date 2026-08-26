import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { SUPABASE_URL } from './authConfig';
import type { AuthSession } from './authTypes';

const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const REDIRECT_URI = 'nexus-plus://auth/callback';
const PKCE_VERIFIER_KEY = 'nexus-plus.supabase.google.pkce.v1';
const PKCE_STATE_KEY = 'nexus-plus.supabase.google.state.v1';

function assertConfigured(): void {
  if (!SUPABASE_URL || !ANON_KEY) throw new Error('SUPABASE_AUTH_NOT_CONFIGURED');
}

function base64Url(value: string): string {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function createPkceVerifier(): Promise<string> {
  return `${Crypto.randomUUID()}${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, '');
}

async function createChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  return base64Url(digest);
}

function createState(): string {
  return `${Crypto.randomUUID()}${Crypto.randomUUID()}`;
}

async function exchangeCode(code: string, verifier: string): Promise<any> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ auth_code: code, code_verifier: verifier }).toString(),
  });

  if (!response.ok) {
    let detail = `SUPABASE_GOOGLE_PKCE_${response.status}`;
    try {
      const payload = await response.json();
      detail = String(payload?.msg ?? payload?.message ?? payload?.error_description ?? detail);
    } catch {
      // Keep stable status-based error.
    }
    throw new Error(detail);
  }

  return response.json();
}

function mapGoogleSession(value: any): AuthSession {
  const metadata = value?.user?.user_metadata ?? {};
  return {
    user: {
      uid: String(value?.user?.id ?? ''),
      email: String(value?.user?.email ?? ''),
      displayName: String(metadata.full_name ?? metadata.name ?? '').trim(),
      photoUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null,
      provider: 'google',
    },
    idToken: String(value?.access_token ?? ''),
    expiresAt: value?.expires_at ? Number(value.expires_at) * 1000 : undefined,
  };
}

/** Google login is Supabase web OAuth; Firebase and Credential Manager are not used. */
export async function nativeGoogleSignIn(): Promise<AuthSession> {
  assertConfigured();

  const verifier = await createPkceVerifier();
  const challenge = await createChallenge(verifier);
  const state = createState();

  await SecureStore.setItemAsync(PKCE_VERIFIER_KEY, verifier);
  await SecureStore.setItemAsync(PKCE_STATE_KEY, state);

  const params = new URLSearchParams({
    provider: 'google',
    redirect_to: REDIRECT_URI,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 's256',
    state,
  });

  const result = await WebBrowser.openAuthSessionAsync(
    `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`,
    REDIRECT_URI,
  );

  if (result.type !== 'success' || !result.url) throw new Error('GOOGLE_SIGN_IN_CANCELLED');

  const callback = new URL(result.url);
  const returnedState = callback.searchParams.get('state');
  const error = callback.searchParams.get('error');
  const errorDescription = callback.searchParams.get('error_description');

  if (error) throw new Error(errorDescription || `GOOGLE_SIGN_IN_${error}`);
  if (!returnedState || returnedState !== state) throw new Error('GOOGLE_SIGN_IN_STATE_MISMATCH');

  const code = callback.searchParams.get('code');
  if (!code) throw new Error('GOOGLE_SIGN_IN_CODE_MISSING');

  const storedVerifier = await SecureStore.getItemAsync(PKCE_VERIFIER_KEY);
  if (!storedVerifier || storedVerifier !== verifier) throw new Error('GOOGLE_SIGN_IN_VERIFIER_MISSING');

  try {
    return mapGoogleSession(await exchangeCode(code, storedVerifier));
  } finally {
    await SecureStore.deleteItemAsync(PKCE_VERIFIER_KEY);
    await SecureStore.deleteItemAsync(PKCE_STATE_KEY);
  }
}

export async function nativeEmailSignIn(): Promise<AuthSession> {
  throw new Error('EMAIL_AUTH_USES_SUPABASE_ADAPTER');
}

export async function nativeEmailRegister(): Promise<AuthSession> {
  throw new Error('EMAIL_AUTH_USES_SUPABASE_ADAPTER');
}

export async function nativeCurrentSession(): Promise<AuthSession | null> {
  return null;
}
