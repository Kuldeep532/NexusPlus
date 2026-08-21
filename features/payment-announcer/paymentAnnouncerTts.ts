import { Platform } from 'react-native';
import type { PaymentAnnouncementTtsProvider } from './paymentAnnouncerTypes';

export interface PaymentAnnouncerTtsAdapter {
  isAvailable(): Promise<boolean>;
  speak(text: string, rate: number, pitch: number): Promise<void>;
  stop(): Promise<void>;
}

async function getPyttsAdapter(): Promise<PaymentAnnouncerTtsAdapter | null> {
  return null;
}

async function getAndroidDefaultAdapter(): Promise<PaymentAnnouncerTtsAdapter | null> {
  if (Platform.OS !== 'android') return null;
  return null;
}

export async function resolvePaymentTtsProvider(
  preferred: PaymentAnnouncementTtsProvider,
): Promise<PaymentAnnouncerTtsProvider | null> {
  const ordered: PaymentAnnouncementTtsProvider[] =
    preferred === 'pytts-voice-sheet'
      ? ['pytts-voice-sheet', 'android-default']
      : ['android-default', 'pytts-voice-sheet'];

  for (const provider of ordered) {
    const adapter = provider === 'pytts-voice-sheet'
      ? await getPyttsAdapter()
      : await getAndroidDefaultAdapter();
    if (await adapter?.isAvailable()) return provider;
  }

  return null;
}

export async function speakPaymentAnnouncement(
  text: string,
  preferred: PaymentAnnouncementTtsProvider,
  rate: number,
  pitch: number,
): Promise<PaymentAnnouncementTtsProvider | null> {
  const ordered: PaymentAnnouncementTtsProvider[] =
    preferred === 'pytts-voice-sheet'
      ? ['pytts-voice-sheet', 'android-default']
      : ['android-default', 'pytts-voice-sheet'];

  for (const provider of ordered) {
    const adapter = provider === 'pytts-voice-sheet'
      ? await getPyttsAdapter()
      : await getAndroidDefaultAdapter();
    if (!adapter || !(await adapter.isAvailable())) continue;
    await adapter.speak(text, rate, pitch);
    return provider;
  }

  return null;
}
