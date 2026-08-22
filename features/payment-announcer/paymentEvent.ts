import { z } from 'zod';

export const paymentEventSchema = z.object({
  eventId: z.string().trim().min(8).max(128),
  timestampMs: z.number().int().finite(),
  senderDisplayName: z.string().trim().min(1).max(80),
  amountMinor: z.number().int().nonnegative().max(9_999_999_999),
  currency: z.string().trim().regex(/^[A-Z]{3}$/),
  status: z.enum(['received', 'settled']),
  source: z.literal('trusted-payment-source'),
  signature: z.string().trim().min(16).max(1024),
});

export type PaymentEvent = z.infer<typeof paymentEventSchema>;

export function parsePaymentEvent(input: unknown): PaymentEvent {
  return paymentEventSchema.parse(input);
}

export function formatPaymentAmount(amountMinor: number, currency: string): string {
  return `${currency} ${(amountMinor / 100).toFixed(2)}`;
}

export function buildAnnouncementText(event: PaymentEvent): string {
  const amount = formatPaymentAmount(event.amountMinor, event.currency);
  const state = event.status === 'settled' ? 'payment received' : 'payment received and processing';
  return `Payment alert. ${state}. ${amount} from ${event.senderDisplayName}.`;
}
