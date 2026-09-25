import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
import type { PremiumPlan } from './premiumPlans';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
const SUPABASE_KEY = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '';

function assertConfigured() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('SUPABASE_PREMIUM_NOT_CONFIGURED');
}

async function request<T>(path: string, options?: RequestInit, requireAuth = true): Promise<T> {
  assertConfigured();
  const token = requireAuth ? await getSupabaseAccessToken() : null;
  if (requireAuth && !token) throw new Error('AUTH_REQUIRED');
  const response = await fetch(SUPABASE_URL + path, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + (token ?? SUPABASE_KEY),
      Accept: 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error('SUPABASE_PREMIUM_REQUEST_' + response.status);
  return response.json() as Promise<T>;
}

type PlanRow = {
  plan_id: number;
  plan_code: string;
  plan_name: string;
  tier_level: number;
  description: string | null;
  price_inr: number | string;
  duration_days: number;
  blocks_ads: boolean;
  unlocks_premium_features: boolean;
};

export type PremiumCatalogPlan = PremiumPlan & {
  code: string;
  tierLevel: number;
  durationDays: number;
  blocksAds: boolean;
  unlocksPremiumFeatures: boolean;
  description: string;
};

export async function getActivePremiumPlans(): Promise<PremiumCatalogPlan[]> {
  const rows = await request<PlanRow[]>(
    '/rest/v1/subscription_plans?select=plan_id,plan_code,plan_name,tier_level,description,price_inr,duration_days,blocks_ads,unlocks_premium_features&is_active=eq.true&order=tier_level.asc',
    undefined,
    false,
  );

  return rows.map((row) => ({
    id: String(row.plan_id),
    name: row.plan_name,
    amount: Number(row.price_inr),
    code: row.plan_code,
    tierLevel: row.tier_level,
    durationDays: row.duration_days,
    blocksAds: row.blocks_ads,
    unlocksPremiumFeatures: row.unlocks_premium_features,
    description: row.description ?? '',
  }));
}

export type PremiumEntitlement = {
  status: string | null;
  planCode: string | null;
  planName: string | null;
  tierLevel: number;
  expiresAt: string | null;
  blocksAds: boolean;
  unlocksPremiumFeatures: boolean;
  productScope: 'nexus_plus';
};

export async function getMyPremiumEntitlement(): Promise<PremiumEntitlement> {
  return request<PremiumEntitlement>('/rest/v1/rpc/get_my_premium_entitlement', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
}

export async function getMyAiCreditBalance(): Promise<number> {
  return request<number>('/rest/v1/rpc/get_my_ai_credit_balance', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
}

export type AiCreditPlan = {
  id: string;
  code: string;
  name: string;
  credits: number;
  amount: number;
  tagline: string;
};

export async function getActiveAiCreditPlans(): Promise<AiCreditPlan[]> {
  const rows = await request<Array<{
    credit_plan_id: number;
    plan_code: string;
    plan_name: string;
    credits_offered: number;
    price_inr: number | string;
    tagline: string | null;
  }>>(
    '/rest/v1/credit_plans?select=credit_plan_id,plan_code,plan_name,credits_offered,price_inr,tagline&is_active=eq.true&order=credits_offered.asc',
    undefined,
    false,
  );

  return rows.map((row) => ({
    id: String(row.credit_plan_id),
    code: row.plan_code,
    name: row.plan_name,
    credits: row.credits_offered,
    amount: Number(row.price_inr),
    tagline: row.tagline ?? '',
  }));
}
