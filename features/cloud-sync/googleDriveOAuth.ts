import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { getGoogleDriveClientId, getGoogleDriveScope, isGoogleDriveConfigured, exchangeGoogleDriveAuthorizationCode } from './googleDriveApi';
import { getCloudSyncBinding, assertBoundAccount } from './cloudSyncBinding';

const VERIFIER_KEY = 'nexusplus.google-drive.oauth.verifier.v1';
const STATE_KEY = 'nexusplus.google-drive.oauth.state.v1';

const REDIRECT_URI = 'nexus-plus://drive/callback';

async function createVerifier(): Promise<string> {
  return `${Crypto.randomUUID()}${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, '');
}

async function challenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier);
  return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function authorizeGoogleDrive(input: { userId: string; email: string }): Promise<void> {
  if (!isGoogleDriveConfigured()) throw new Error('GOOGLE_DRIVE_NOT_CONFIGURED');
  const binding = await getCloudSyncBinding();
  assertBoundAccount(binding, input.userId, input.email);

  const verifier = await createVerifier();
  const state = `${Crypto.randomUUID()}${Crypto.randomUUID()}`;
  await SecureStore.setItemAsync(VERIFIER_KEY, verifier);
  await SecureStore.setItemAsync(STATE_KEY, state);

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', getGoogleDriveClientId());
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', getGoogleDriveScope());
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('code_challenge', await challenge(verifier));
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  url.searchParams.set('login_hint', input.email);

  const result = await WebBrowser.openAuthSessionAsync(url.toString(), REDIRECT_URI);
  if (result.type !== 'success' || !result.url) {
    await SecureStore.deleteItemAsync(VERIFIER_KEY);
    await SecureStore.deleteItemAsync(STATE_KEY);
    throw new Error('GOOGLE_DRIVE_AUTH_CANCELLED');
  }

  const callback = new URL(result.url);
  const returnedState = callback.searchParams.get('state');
  const error = callback.searchParams.get('error');
  if (error) throw new Error(callback.searchParams.get('error_description') ?? `GOOGLE_DRIVE_${error}`);
  if (returnedState !== state) throw new Error('GOOGLE_DRIVE_STATE_MISMATCH');

  const code = callback.searchParams.get('code');
  const storedVerifier = await SecureStore.getItemAsync(VERIFIER_KEY);
  if (!code || !storedVerifier || storedVerifier !== verifier) throw new Error('GOOGLE_DRIVE_PKCE_INVALID');

  try {
    await exchangeGoogleDriveAuthorizationCode({
      code,
      codeVerifier: storedVerifier,
      redirectUri: REDIRECT_URI,
      email: input.email,
      userId: input.userId,
    });
  } finally {
    await SecureStore.deleteItemAsync(VERIFIER_KEY);
    await SecureStore.deleteItemAsync(STATE_KEY);
  }
}
