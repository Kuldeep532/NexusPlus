import { NativeModules, Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

type NativePaymentSecurity = {
  getBiometricCapability: () => Promise<{
    hardware: boolean;
    enrolled: boolean;
    deviceCredentialAvailable: boolean;
    securityLevel: 'strong' | 'weak' | 'none';
  }>;
  authenticate: (
    promptMessage: string,
  ) => Promise<{ success: boolean; error?: string }>;
};

const { NexusVault } = NativeModules;

function nativeSecurity(): NativePaymentSecurity {
  if (Platform.OS === 'android' && NexusVault) return NexusVault as NativePaymentSecurity;
  throw new Error('Native payment security module is unavailable.');
}

export async function getPaymentBiometricCapability() {
  if (Platform.OS === 'android') return nativeSecurity().getBiometricCapability();
  return {
    hardware: false,
    enrolled: false,
    deviceCredentialAvailable: false,
    securityLevel: 'none' as const,
  };
}

export async function authenticatePaymentAnnouncer(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const capability = await getPaymentBiometricCapability();
  if (!capability.hardware || !capability.enrolled || capability.securityLevel !== 'strong') {
    return false;
  }
  const result = await nativeSecurity().authenticate('Unlock Payment Announcer');
  return result.success === true;
}

export async function enablePaymentScreenProtection(): Promise<void> {
  await ScreenCapture.preventScreenCaptureAsync('nexusplus-payment-announcer');
  await ScreenCapture.enableAppSwitcherProtectionAsync(1);
}

export async function disablePaymentScreenProtection(): Promise<void> {
  await ScreenCapture.allowScreenCaptureAsync('nexusplus-payment-announcer');
  await ScreenCapture.disableAppSwitcherProtectionAsync();
}
