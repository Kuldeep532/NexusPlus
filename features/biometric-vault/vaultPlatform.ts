import { Platform } from 'react-native';

export type VaultPlatform = 'android' | 'ios' | 'unsupported';

export function getVaultPlatform(): VaultPlatform {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  return 'unsupported';
}

export function requiresNativeVaultAdapter(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}
