import * as ScreenCapture from 'expo-screen-capture';
import type { NativeVaultBackend } from '@/features/biometric-vault/nativeVaultContract';
import { getAndroidVaultBackend } from '@/features/biometric-vault/nativeVaultBackend.android';

const EXPENSE_AUTH_REASON = 'Unlock Expense Tracker';
const EXPENSE_SCREEN_PROTECTION_KEY = 'nexusplus-expense-tracker';

function getVaultBackend(): NativeVaultBackend | null {
  return getAndroidVaultBackend();
}

export async function isExpenseBiometricAvailable(): Promise<boolean> {
  const backend = getVaultBackend();
  if (!backend) return false;
  return backend.isAvailable();
}

export async function authenticateExpenseTracker(): Promise<boolean> {
  const backend = getVaultBackend();
  if (!backend || !(await backend.isAvailable())) return false;
  return backend.authenticate(EXPENSE_AUTH_REASON, false);
}

export async function enableExpenseScreenProtection(): Promise<void> {
  await ScreenCapture.preventScreenCaptureAsync(EXPENSE_SCREEN_PROTECTION_KEY);
  await ScreenCapture.enableAppSwitcherProtectionAsync(1);
}

export async function disableExpenseScreenProtection(): Promise<void> {
  await ScreenCapture.allowScreenCaptureAsync(EXPENSE_SCREEN_PROTECTION_KEY);
  await ScreenCapture.disableAppSwitcherProtectionAsync();
}
