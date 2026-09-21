import * as SecureStore from 'expo-secure-store';
import type { CloudSyncAccountBinding } from './cloudSyncTypes';

const KEY = 'nexusplus.cloud-sync.account-binding.v1';

export async function getCloudSyncBinding(): Promise<CloudSyncAccountBinding | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CloudSyncAccountBinding;
  } catch {
    await SecureStore.deleteItemAsync(KEY);
    return null;
  }
}

export async function bindCloudSyncAccount(binding: CloudSyncAccountBinding): Promise<void> {
  const current = await getCloudSyncBinding();
  if (current && (current.ownerUserId !== binding.ownerUserId || current.ownerEmail.toLowerCase() !== binding.ownerEmail.toLowerCase())) {
    throw new Error('CLOUD_SYNC_ACCOUNT_MISMATCH');
  }
  await SecureStore.setItemAsync(KEY, JSON.stringify(binding));
}

export async function clearCloudSyncBinding(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}

export function assertBoundAccount(binding: CloudSyncAccountBinding | null, userId: string, email: string): CloudSyncAccountBinding {
  if (!binding) throw new Error('CLOUD_SYNC_ACCOUNT_NOT_BOUND');
  if (binding.ownerUserId !== userId || binding.ownerEmail.toLowerCase() !== email.toLowerCase()) {
    throw new Error('CLOUD_SYNC_ACCOUNT_MISMATCH');
  }
  return binding;
}
