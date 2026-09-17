import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
import { mapPremiumPlan, type PremiumPlan, type PremiumPlanRow } from './premiumPlans';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

function assertConfigured() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('SUPABASE_PREMIUM_NOT_CONFIGURED');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  assertConfigured();
  const token = await getSupabaseAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`SUPABASE_PREMIUM_REQUEST_${response.status}`);
  return response.json() as Promise<T>;
}

export async function getActivePremiumPlans(): Promise<PremiumPlan[]> {
  const rows = await request<PremiumPlanRow[]>('/rest/v1/app_subscription_plans?select=plan_id,plan_name,amount,upi_id,merchant_name&is_active=eq.true&order=amount.asc');
  return rows.map(mapPremiumPlan);
}

export type PaymentTransaction = {
  transactionId: string;
  planId: string;
  amount: number;
  upiId: string;
  merchantName: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
};

export async function createPendingTransaction(planId: string): Promise<PaymentTransaction> {
  const response = await request<{
    transactionId: string;
    planId: number;
    amount: number;
    upiId: string;
    merchantName: string;
    status: PaymentTransaction['status'];
  }>('/rest/v1/rpc/create_upi_payment_transaction', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ p_plan_id: Number(planId) }),
  });
  return {
    transactionId: response.transactionId,
    planId: String(response.planId),
    amount: Number(response.amount),
    upiId: response.upiId,
    merchantName: response.merchantName,
    status: response.status,
  };
}

export async function getTransaction(transactionId: string): Promise<PaymentTransaction> {
  const rows = await request<Array<{ transaction_id: string; plan_id: number; amount_paid: number; payment_status: PaymentTransaction['status'] }>>(`/rest/v1/payment_transactions?select=transaction_id,plan_id,amount_paid,payment_status&transaction_id=eq.${encodeURIComponent(transactionId)}&limit=1`);
  const row = rows[0];
  if (!row) throw new Error('PAYMENT_TRANSACTION_NOT_FOUND');
  const plan = (await request<PremiumPlanRow[]>(`/rest/v1/app_subscription_plans?select=plan_id,plan_name,amount,upi_id,merchant_name&plan_id=eq.${row.plan_id}&limit=1`))[0];
  if (!plan) throw new Error('PREMIUM_PLAN_NOT_FOUND');
  const mapped = mapPremiumPlan(plan);
  return { transactionId: row.transaction_id, planId: String(row.plan_id), amount: Number(row.amount_paid), upiId: mapped.upiId, merchantName: mapped.merchantName, status: row.payment_status };
}
