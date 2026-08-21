import { AppState, type AppStateStatus, AccessibilityInfo } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { authenticatePaymentAnnouncer, disablePaymentScreenProtection, enablePaymentScreenProtection, isPaymentBiometricAvailable } from './paymentAnnouncerSecurity';
import { isPaymentAnnouncerSetupComplete, loadPaymentAnnouncerSettings, markPaymentAnnouncerSetupComplete, savePaymentAnnouncerSettings } from './paymentAnnouncerRepository';
import { DEFAULT_PAYMENT_ANNOUNCER_SETTINGS, type PaymentAnnouncerSettings } from './paymentAnnouncerTypes';

export function usePaymentAnnouncer() {
  const [isReady, setIsReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [settings, setSettings] = useState<PaymentAnnouncerSettings>(DEFAULT_PAYMENT_ANNOUNCER_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = null;
  }, []);

  const lock = useCallback(async () => {
    clearTimer();
    setIsUnlocked(false);
    try { await disablePaymentScreenProtection(); } catch { /* protection teardown must not crash the app */ }
  }, [clearTimer]);

  const scheduleLock = useCallback(() => {
    clearTimer();
    lockTimer.current = setTimeout(() => { void lock(); }, settings.autoLockSeconds * 1000);
  }, [clearTimer, lock, settings.autoLockSeconds]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [available, setup, loadedSettings] = await Promise.all([
          isPaymentBiometricAvailable(),
          isPaymentAnnouncerSetupComplete(),
          loadPaymentAnnouncerSettings(),
        ]);
        if (cancelled) return;
        setBiometricAvailable(available);
        setSetupComplete(setup);
        setSettings(loadedSettings);
        setIsReady(true);
      } catch {
        if (!cancelled) {
          setError('Payment Announcer security initialization failed.');
          setIsReady(true);
        }
      }
    })();
    return () => { cancelled = true; clearTimer(); };
  }, [clearTimer]);

  const unlock = useCallback(async () => {
    setError(null);
    if (!biometricAvailable) {
      setError('A strong biometric enrolled in Biometric Vault is required.');
      return false;
    }
    const success = await authenticatePaymentAnnouncer();
    if (!success) {
      setError('Biometric authentication failed or was cancelled.');
      return false;
    }
    await enablePaymentScreenProtection();
    setIsUnlocked(true);
    scheduleLock();
    AccessibilityInfo.announceForAccessibility?.('Payment Announcer unlocked');
    return true;
  }, [biometricAvailable, scheduleLock]);

  const setup = useCallback(async () => {
    setError(null);
    if (!biometricAvailable) {
      setError('Set up a strong biometric in Biometric Vault before using Payment Announcer.');
      return false;
    }
    const success = await authenticatePaymentAnnouncer();
    if (!success) {
      setError('Biometric verification is required to enable Payment Announcer.');
      return false;
    }
    await markPaymentAnnouncerSetupComplete();
    setSetupComplete(true);
    await enablePaymentScreenProtection();
    setIsUnlocked(true);
    scheduleLock();
    AccessibilityInfo.announceForAccessibility?.('Payment Announcer setup complete');
    return true;
  }, [biometricAvailable, scheduleLock]);

  const updateSettings = useCallback(async (patch: Partial<PaymentAnnouncerSettings>) => {
    if (!isUnlocked) return false;
    const next = { ...settings, ...patch };
    await savePaymentAnnouncerSettings(next);
    setSettings(next);
    scheduleLock();
    return true;
  }, [isUnlocked, scheduleLock, settings]);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next !== 'active' && isUnlocked) void lock();
    };
    const subscription = AppState.addEventListener('change', onAppState);
    return () => subscription.remove();
  }, [isUnlocked, lock]);

  return { isReady, isUnlocked, setupComplete, biometricAvailable, settings, error, setup, unlock, lock, updateSettings };
}
