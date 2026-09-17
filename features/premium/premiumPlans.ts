export interface PremiumPlan {
  planId: string;
  planName: string;
  amount: number;
  upiId: string;
  merchantName: string;
}

/** Premium plans are loaded exclusively from the Supabase app_subscription_plans table. */
export type PremiumPlanRow = {
  plan_id: number;
  plan_name: string;
  amount: number;
  upi_id: string;
  merchant_name?: string | null;
};

export function mapPremiumPlan(row: PremiumPlanRow): PremiumPlan {
  if (!row?.plan_id || !row.plan_name || !Number.isFinite(Number(row.amount)) || !row.upi_id) {
    throw new Error('INVALID_PREMIUM_PLAN');
  }
  return {
    planId: String(row.plan_id),
    planName: row.plan_name,
    amount: Number(row.amount),
    upiId: row.upi_id.trim(),
    merchantName: row.merchant_name?.trim() || 'Nexus Wave',
  };
}
