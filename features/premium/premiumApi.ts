import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
import type { PremiumPlanCode } from './premiumPlans';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

function assertConfigured(): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('SUPABASE_PREMIUM_NOT_CONFIGURED');
}

async function callRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  assertConfigured();
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) throw new Error('AUTH_REQUIRED');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `SUPABASE_RPC_${name}_${response.status}`;
    try {
      const payload = await response.json();
      message = String(payload?.message ?? payload?.msg ?? payload?.error ?? message);
    } catch {
      // Keep stable status-based error.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export type PremiumCheckoutSession = {
  checkoutUrl?: string;
  razorpayKeyId?: string;
  razorpaySubscriptionId?: string;
  paymentId?: string;
  planCode: PremiumPlanCode;
};

/**
 * Starts a server-authoritative Premium checkout. The server creates the Razorpay
 * subscription/order and returns only public checkout data to the app.
 */
export async function createPremiumCheckout(planCode: PremiumPlanCode): Promise<PremiumCheckoutSession> {
  return callRpc<PremiumCheckoutSession>('create_premium_checkout', { p_plan_code: planCode });
}

export type PremiumEntitlement = {
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED' | null;
  planCode: PremiumPlanCode | null;
  expiresAt: string | null;
  blocksAds: boolean;
  unlocksPremiumFeatures: boolean;
};

export async function getPremiumEntitlement(): Promise<PremiumEntitlement> {
  return callRpc<PremiumEntitlement>('get_my_premium_entitlement', {});
}
