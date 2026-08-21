import type { PaymentEvent } from './paymentEvent';

const MAX_EVENT_AGE_MS = 5 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 30 * 1000;
const seenEventIds = new Map<string, number>();

function prune(now: number): void {
  for (const [id, timestamp] of seenEventIds) {
    if (now - timestamp > MAX_EVENT_AGE_MS) seenEventIds.delete(id);
  }
}

export function validatePaymentEventFreshness(event: PaymentEvent, now = Date.now()): boolean {
  const age = now - event.timestampMs;
  return age >= -MAX_FUTURE_SKEW_MS && age <= MAX_EVENT_AGE_MS;
}

export function isDuplicatePaymentEvent(eventId: string, now = Date.now()): boolean {
  prune(now);
  return seenEventIds.has(eventId);
}

export function rememberPaymentEvent(eventId: string, now = Date.now()): void {
  prune(now);
  seenEventIds.set(eventId, now);
}

/**
 * The signature is deliberately treated as opaque in the client. A trusted
 * payment-source adapter must verify it before passing the event here.
 */
export function isTrustedPaymentEvent(event: PaymentEvent): boolean {
  return event.source === 'trusted-payment-source' && event.signature.length >= 16;
}

export function acceptPaymentEvent(event: PaymentEvent, now = Date.now()): boolean {
  if (!isTrustedPaymentEvent(event)) return false;
  if (!validatePaymentEventFreshness(event, now)) return false;
  if (isDuplicatePaymentEvent(event.eventId, now)) return false;
  rememberPaymentEvent(event.eventId, now);
  return true;
}
