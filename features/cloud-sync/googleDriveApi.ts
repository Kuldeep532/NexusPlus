import * as SecureStore from 'expo-secure-store';
import { sha256Hex } from './cloudCrypto';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const TOKEN_KEY = 'nexusplus.google-drive.oauth.v1';
const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_CLIENT_ID?.trim() ?? '';
const ENABLED = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_ENABLED === 'true' && CLIENT_ID.length > 0;
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

export type GoogleDriveAuthState = { accessToken: string; refreshToken?: string; expiresAt: number; email: string; userId: string };

export function isGoogleDriveConfigured(): boolean {
  return ENABLED;
}

export function getGoogleDriveScope(): string {
  return SCOPE;
}

export function getGoogleDriveClientId(): string {
  return CLIENT_ID;
}

export async function getStoredGoogleDriveAuth(): Promise<GoogleDriveAuthState | null> {
  if (!ENABLED) return null;
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as GoogleDriveAuthState;
    if (!value.accessToken || !value.email || !value.userId) return null;
    if (value.expiresAt <= Date.now()) return null;
    return value;
  } catch {
    return null;
  }
}

export async function persistGoogleDriveAuth(value: GoogleDriveAuthState): Promise<void> {
  if (!ENABLED) return;
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(value));
}

export async function clearGoogleDriveAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function driveRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const auth = await getStoredGoogleDriveAuth();
  if (!auth) throw new Error('GOOGLE_DRIVE_NOT_AUTHORIZED');
  const response = await fetch(`${DRIVE_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${auth.accessToken}`, ...(init.headers ?? {}) },
  });
  if (response.status === 401) {
    await clearGoogleDriveAuth();
    throw new Error('GOOGLE_DRIVE_AUTH_EXPIRED');
  }
  return response;
}

export async function createEncryptedAppDataFile(input: { fileName: string; ciphertext: string }): Promise<{ id: string }> {
  if (!ENABLED) throw new Error('GOOGLE_DRIVE_NOT_CONFIGURED');
  const boundary = `nexus-${await sha256Hex(input.fileName)}`;
  const metadata = JSON.stringify({ name: input.fileName, parents: ['appDataFolder'], description: 'Nexus Test encrypted application data' });
  const body = [
    `--${boundary}`, 'Content-Type: application/json; charset=UTF-8', '', metadata,
    `--${boundary}`, 'Content-Type: application/octet-stream', '', input.ciphertext,
    `--${boundary}--`, '',
  ].join('\r\n');
  const response = await driveRequest('/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!response.ok) throw new Error(`GOOGLE_DRIVE_UPLOAD_${response.status}`);
  return await response.json() as { id: string };
}

export async function findEncryptedAppDataFile(fileName: string): Promise<{ id: string; name: string } | null> {
  if (!ENABLED) return null;
  const q = encodeURIComponent(`name = '${fileName.replace(/'/g, "\\'")}' and trashed = false`);
  const response = await driveRequest(`/files?q=${q}&spaces=appDataFolder&fields=files(id,name)&pageSize=10`);
  if (!response.ok) throw new Error(`GOOGLE_DRIVE_LIST_${response.status}`);
  const payload = await response.json() as { files?: Array<{id:string;name:string}> };
  return payload.files?.[0] ?? null;
}

export async function downloadEncryptedAppDataFile(fileId: string): Promise<string> {
  const response = await driveRequest(`/files/${encodeURIComponent(fileId)}?alt=media`);
  if (!response.ok) throw new Error(`GOOGLE_DRIVE_DOWNLOAD_${response.status}`);
  return response.text();
}
