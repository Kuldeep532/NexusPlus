import { authenticatePaymentAnnouncer } from './paymentAnnouncerSecurity';

export interface PaymentAnnouncerUiSession {
  authenticated: boolean;
  expiresAt: number;
}

const UI_SESSION_MS = 60_000;
let session: PaymentAnnouncerUiSession | null = null;

export function isPaymentAnnouncerUiAuthenticated(now = Date.now()): boolean {
  return Boolean(session?.authenticated && session.expiresAt > now);
}

export function clearPaymentAnnouncerUiSession(): void {
  session = null;
}

export async function requirePaymentAnnouncerUiAuthentication(): Promise<boolean> {
  if (isPaymentAnnouncerUiAuthenticated()) return true;
  const success = await authenticatePaymentAnnouncer();
  if (!success) {
    clearPaymentAnnouncerUiSession();
    return false;
  }
  session = { authenticated: true, expiresAt: Date.now() + UI_SESSION_MS };
  return true;
}
