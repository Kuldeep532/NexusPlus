export interface AccountBindingRecord {
  accountId: string;
  deviceBindingId: string;
  createdAt: string;
  deletedAt: string | null;
  deletionLockUntil: string | null;
  status: 'active' | 'pending_delete' | 'blocked';
}

export interface LoginSecurityDecision {
  allowed: boolean;
  reason:
    | 'allowed'
    | 'device_already_bound'
    | 'account_already_bound'
    | 'deletion_cooldown'
    | 'device_integrity_failed'
    | 'account_blocked';
}

const ACCOUNT_DELETION_COOLDOWN_DAYS = 30;

export function deletionLockUntil(createdAt: Date): Date {
  const result = new Date(createdAt);
  result.setUTCDate(result.getUTCDate() + ACCOUNT_DELETION_COOLDOWN_DAYS);
  return result;
}

/**
 * Policy is intentionally data-model only. Enforcement must happen on the
 * authenticated backend using a transaction/unique constraints; the client
 * cannot safely enforce one-account-per-device by itself.
 */
export function describeBindingPolicy(): {
  uniqueDeviceBinding: true;
  uniqueActiveAccountBinding: true;
  deletionCooldownDays: number;
} {
  return {
    uniqueDeviceBinding: true,
    uniqueActiveAccountBinding: true,
    deletionCooldownDays: ACCOUNT_DELETION_COOLDOWN_DAYS,
  };
}
