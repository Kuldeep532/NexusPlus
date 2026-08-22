import type { PaymentEvent } from './paymentEvent';

export interface PaymentEventVerifier {
  verify(event: PaymentEvent): Promise<boolean>;
}

/**
 * No cryptographic payment-source verifier is bundled until the actual trusted
 * payment provider contract is available. Keeping this gate explicit prevents
 * arbitrary notification text from being treated as a financial event.
 */
export const unavailablePaymentEventVerifier: PaymentEventVerifier = {
  verify: async () => false,
};
