import { buildAnnouncementText, parsePaymentEvent, type PaymentEvent } from './paymentEvent';
import { dequeuePaymentEvent } from './paymentEventQueue';
import { unavailablePaymentEventVerifier, type PaymentEventVerifier } from './paymentEventVerifier';
import { resolvePaymentTtsProvider, speakPaymentAnnouncement } from './paymentAnnouncerTts';
import type { PaymentAnnouncementTtsProvider } from './paymentAnnouncerTypes';

export interface PaymentAnnouncementSession {
  enabled: boolean;
  preferredTtsProvider: PaymentAnnouncementTtsProvider;
  speechRate: number;
  speechPitch: number;
  verifier?: PaymentEventVerifier;
}

export async function acceptIncomingPaymentEvent(
  input: unknown,
  verifier: PaymentEventVerifier = unavailablePaymentEventVerifier,
): Promise<boolean> {
  try {
    const event = parsePaymentEvent(input);
    if (!(await verifier.verify(event))) return false;
    const { enqueuePaymentEvent } = await import('./paymentEventQueue');
    return enqueuePaymentEvent(event);
  } catch {
    return false;
  }
}

/**
 * Background announcements intentionally do not require the UI biometric session.
 * The upstream event verifier remains the security boundary for financial events.
 */
export async function announceNextPayment(session: PaymentAnnouncementSession): Promise<PaymentEvent | null> {
  if (!session.enabled) return null;

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
