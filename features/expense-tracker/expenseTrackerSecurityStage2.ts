import { AppState, type AppStateStatus } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { authenticatePaymentAnnouncer, disablePaymentScreenProtection, enablePaymentScreenProtection, isPaymentBiometricAvailable } from '@/features/payment-announcer/paymentAnnouncerSecurity';

export function useExpenseTrackerSecurity(autoLockMs = 60_000) {
  const [available, setAvailable] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const lock = useCallback(async () => {
    clearTimer();
    setUnlocked(false);
    try { await disablePaymentScreenProtection(); } catch { /* fail closed */ }
  }, [clearTimer]);

  const unlock = useCallback(async () => {
    if (!available) return false;
    const ok = await authenticatePaymentAnnouncer();
    if (!ok) {
      await lock();
      return false;
    }
    await enablePaymentScreenProtection();
    setUnlocked(true);
    clearTimer();
    timer.current = setTimeout(() => { void lock(); }, Math.max(15_000, autoLockMs));
    return true;
  }, [available, autoLockMs, clearTimer, lock]);

  useEffect(() => {
    void isPaymentBiometricAvailable().then(setAvailable);
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    const handleState = (state: AppStateStatus) => {
      if (state !== 'active' && unlocked) void lock();
    };
    const subscription = AppState.addEventListener('change', handleState);
    return () => subscription.remove();
  }, [lock, unlocked]);

  return { available, unlocked, unlock, lock };
}
