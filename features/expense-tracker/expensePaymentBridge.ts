import type { PaymentEvent } from '@/features/payment-announcer/paymentEvent';
import type { ExpenseDetectionInput } from './expenseTrackerTypes';

export function paymentEventToExpenseInput(event: PaymentEvent): ExpenseDetectionInput {
  return {
    source: 'payment-announcer',
    sourceEventId: event.eventId,
    amountMinor: event.amountMinor,
    currency: event.currency,
    occurredAtMs: event.timestampMs,
    merchantText: event.senderDisplayName,
    rawTextFingerprint: null,
  };
}
