import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_PAYMENT_ANNOUNCER_SETTINGS,
  type PaymentAnnouncerSettings,
} from './paymentAnnouncerTypes';

const SETTINGS_KEY = 'nexus-plus.payment-announcer.settings.v1';
const SETUP_KEY = 'nexus-plus.payment-announcer.setup.v1';

function sanitizeSettings(input: Partial<PaymentAnnouncerSettings> | null | undefined): PaymentAnnouncerSettings {
  const speechRate = Number(input?.speechRate ?? DEFAULT_PAYMENT_ANNOUNCER_SETTINGS.speechRate);
  const speechPitch = Number(input?.speechPitch ?? DEFAULT_PAYMENT_ANNOUNCER_SETTINGS.speechPitch);
  const autoLockSeconds = Number(input?.autoLockSeconds ?? DEFAULT_PAYMENT_ANNOUNCER_SETTINGS.autoLockSeconds);

  return {
    enabled: input?.enabled ?? DEFAULT_PAYMENT_ANNOUNCER_SETTINGS.enabled,
    preferredTtsProvider: input?.preferredTtsProvider === 'android-default' ? 'android-default' : 'pytts-voice-sheet',
    speechRate: Number.isFinite(speechRate) ? Math.min(2, Math.max(0.5, speechRate)) : 1,
    speechPitch: Number.isFinite(speechPitch) ? Math.min(2, Math.max(0.5, speechPitch)) : 1,
    autoLockSeconds: Number.isFinite(autoLockSeconds) ? Math.min(300, Math.max(15, Math.round(autoLockSeconds))) : 30,
  };
}

export async function loadPaymentAnnouncerSettings(): Promise<PaymentAnnouncerSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return sanitizeSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_PAYMENT_ANNOUNCER_SETTINGS;
  }
}

export async function savePaymentAnnouncerSettings(settings: PaymentAnnouncerSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitizeSettings(settings)));
}

export async function isPaymentAnnouncerSetupComplete(): Promise<boolean> {
  return (await AsyncStorage.getItem(SETUP_KEY)) === '1';
}

export async function markPaymentAnnouncerSetupComplete(): Promise<void> {
  await AsyncStorage.setItem(SETUP_KEY, '1');
}
