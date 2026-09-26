import { getMyPremiumEntitlement } from '@/features/premium/premiumRepository';

export async function hasEPaperPremium(): Promise<boolean> {
  try {
    const entitlement = await getMyPremiumEntitlement();
    return Boolean(
      entitlement.unlocksPremiumFeatures &&
      entitlement.tierLevel > 1 &&
      (!entitlement.expiresAt || new Date(entitlement.expiresAt).getTime() > Date.now()),
    );
  } catch {
    return false;
  }
}
