import * as ScreenCapture from 'expo-screen-capture';
import type { NativeVaultBackend } from '@/features/biometric-vault/nativeVaultContract';
import { getAndroidVaultBackend } from '@/features/biometric-vault/nativeVaultBackend.android';

const PAYMENT_AUTH_REASON = 'Unlock Payment Announcer';
const PAYMENT_SCREEN_PROTECTION_KEY = 'nexusplus-payment-announcer';

function getVaultBackend(): NativeVaultBackend | null {
  return getAndroidVaultBackend();
}

export async function isPaymentBiometricAvailable(): Promise<boolean> {
  const backend = getVaultBackend();
  if (!backend) return false;
  return backend.isAvailable();
}

export async function authenticatePaymentAnnouncer(): Promise<boolean> {
  const backend = getVaultBackend();
  if (!backend || !(await backend.isAvailable())) return false;

  // Payment Announcer is intentionally biometric-only. Device credentials are not accepted.
  return backend.authenticate(PAYMENT_AUTH_REASON, false);
}

export async function enablePaymentScreenProtection(): Promise<void> {
  await ScreenCapture.preventScreenCaptureAsync(PAYMENT_SCREEN_PROTECTION_KEY);
  await ScreenCapture.enableAppSwitcherProtectionAsync(1);
}

export async function disablePaymentScreenProtection(): Promise<void> {
  await ScreenCapture.allowScreenCaptureAsync(PAYMENT_SCREEN_PROTECTION_KEY);
  await ScreenCapture.disableAppSwitcherProtectionAsync();
}
