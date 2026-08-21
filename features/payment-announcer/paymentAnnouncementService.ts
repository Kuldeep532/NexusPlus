import { buildAnnouncementText, parsePaymentEvent, type PaymentEvent } from './paymentEvent';
import { dequeuePaymentEvent } from './paymentEventQueue';
import { unavailablePaymentEventVerifier, type PaymentEventVerifier } from './paymentEventVerifier';
import { resolvePaymentTtsProvider, speakPaymentAnnouncement } from './paymentAnnouncerTts';
import type { PaymentAnnouncementTtsProvider } from './paymentAnnouncerTypes';

export interface PaymentAnnouncementSession {
  isUnlocked: boolean;
  enabled: boolean;
  preferredTtsProvider: PaymentAnnouncementTtsProvider;
  speechRate: number;
  speechPitch: number;
  verifier?: PaymentEventVerifier;
}

/**
 * Events must pass cryptographic verification before entering the protected
 * announcement queue. The default verifier fails closed until a real trusted
 * payment provider integration is supplied.
 */
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
