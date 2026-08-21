import { buildAnnouncementText, parsePaymentEvent, type PaymentEvent } from './paymentEvent';
import { dequeuePaymentEvent, enqueuePaymentEvent } from './paymentEventQueue';
import { resolvePaymentTtsProvider, speakPaymentAnnouncement } from './paymentAnnouncerTts';
import type { PaymentAnnouncementTtsProvider } from './paymentAnnouncerTypes';

export interface PaymentAnnouncementSession {
  isUnlocked: boolean;
  enabled: boolean;
  preferredTtsProvider: PaymentAnnouncementTtsProvider;
  speechRate: number;
  speechPitch: number;
}

export function acceptIncomingPaymentEvent(input: unknown): boolean {
  try {
    const event = parsePaymentEvent(input);
    return enqueuePaymentEvent(event);
  } catch {
    return false;
  }
}

export async function announceNextPayment(session: PaymentAnnouncementSession): Promise<PaymentEvent | null> {
  if (!session.isUnlocked || !session.enabled) return null;

  const event = dequeuePaymentEvent();
  if (!event) return null;

  const provider = await resolvePaymentTtsProvider(session.preferredTtsProvider);
  if (!provider) return null;

  const text = buildAnnouncementText(event);
  const usedProvider = await speakPaymentAnnouncement(
    text,
    provider,
    session.speechRate,
    session.speechPitch,
  );

  if (!usedProvider) return null;
  return event;
}
