import { Platform } from 'react-native';
import type { PaymentAnnouncementTtsProvider } from './paymentAnnouncerTypes';
import { getInstalledVoices, type InstalledVoice } from '@/features/voice-library/voiceStore';

export interface PaymentAnnouncerTtsAdapter {
  isAvailable(): Promise<boolean>;
  speak(text: string, rate: number, pitch: number): Promise<void>;
  stop(): Promise<void>;
}

async function getInstalledVoice(): Promise<InstalledVoice | null> {
  const voices = await getInstalledVoices();
  return voices[0] ?? null;
}

async function getPyttsAdapter(): Promise<PaymentAnnouncerTtsAdapter | null> {
  const installed = await getInstalledVoice();
  if (!installed) return null;

  // The downloaded voice sheet is the supported local voice source. The actual
  // inference bridge must remain inside the app's verified voice engine adapter.
  return {
    isAvailable: async () => Boolean(installed.modelPath && installed.configPath),
    speak: async () => {
      throw new Error('Verified local voice engine adapter is required.');
    },
    stop: async () => undefined,
  };
}

async function getAndroidDefaultAdapter(): Promise<PaymentAnnouncerTtsAdapter | null> {
  if (Platform.OS !== 'android') return null;

  return {
    isAvailable: async () => false,
    speak: async () => {
      throw new Error('Verified Android TTS adapter is required.');
    },
    stop: async () => undefined,
  };
}

export async function resolvePaymentTtsProvider(
  preferred: PaymentAnnouncementTtsProvider,
): Promise<PaymentAnnouncementTtsProvider | null> {
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
