import type { PaymentEvent } from './paymentEvent';
import { acceptPaymentEvent } from './paymentEventSecurity';

const MAX_QUEUE = 20;
const queue: PaymentEvent[] = [];

export function enqueuePaymentEvent(event: PaymentEvent): boolean {
  if (!acceptPaymentEvent(event)) return false;
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push(event);
  return true;
}

export function dequeuePaymentEvent(): PaymentEvent | null {
  return queue.shift() ?? null;
}

export function clearPaymentEventQueue(): void {
  queue.length = 0;
}

export function getPaymentEventQueueSize(): number {
  return queue.length;
}
