export type PremiumPlanCode = 'lifeline_monthly' | 'super_monthly' | 'pro_monthly';

export interface PremiumPlan {
  planCode: PremiumPlanCode;
  name: string;
  priceInr: number;
  durationDays: number;
  tagline: string;
  blocksAds: boolean;
  unlocksPremiumFeatures: boolean;
  razorpayPlanId?: string;
}

/**
 * Product catalogue. Razorpay plan ids are deliberately injected from server configuration
 * instead of being hard-coded into the client once production plans are created.
 */
export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    planCode: 'lifeline_monthly',
    name: 'Lifeline',
    priceInr: 49,
    durationDays: 30,
    tagline: 'Ad-free Nexus Plus with essential member perks.',
    blocksAds: true,
    unlocksPremiumFeatures: false,
  },
  {
    planCode: 'super_monthly',
    name: 'Super',
    priceInr: 149,
    durationDays: 30,
    tagline: 'Premium toolkit access for everyday power users.',
    blocksAds: true,
    unlocksPremiumFeatures: true,
  },
  {
    planCode: 'pro_monthly',
    name: 'Pro',
    priceInr: 399,
    durationDays: 30,
    tagline: 'Full Premium access for intensive media and AI workflows.',
    blocksAds: true,
    unlocksPremiumFeatures: true,
  },
];

export function getPremiumPlan(planCode: PremiumPlanCode): PremiumPlan {
  const plan = PREMIUM_PLANS.find((item) => item.planCode === planCode);
  if (!plan) throw new Error('PREMIUM_PLAN_NOT_FOUND');
  return plan;
}
