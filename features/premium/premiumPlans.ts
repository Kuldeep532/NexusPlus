export interface PremiumPlanRow {
  plan_id: number | string;
  plan_name: string;
  amount: number | string;
  upi_id: string;
  merchant_name?: string | null;
}

export interface PremiumPlan {
  planId: string;
  name: string;
  amountInr: number;
  upiId: string;
  merchantName: string;
}

export function mapPremiumPlan(row: PremiumPlanRow): PremiumPlan {
  const amountInr = Number(row.amount);
  if (!Number.isFinite(amountInr) || amountInr <= 0) throw new Error('PREMIUM_PLAN_AMOUNT_INVALID');
  const upiId = row.upi_id.trim();
  if (!upiId) throw new Error('PREMIUM_PLAN_UPI_INVALID');
  return {
    planId: String(row.plan_id),
    name: row.plan_name.trim() || 'Premium plan',
    amountInr,
    upiId,
    merchantName: row.merchant_name?.trim() || 'Nexus Wave',
  };
}
