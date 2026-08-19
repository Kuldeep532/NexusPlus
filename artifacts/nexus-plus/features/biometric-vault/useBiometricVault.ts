import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  DEFAULT_VAULT_SECURITY,
  VaultItem,
  VaultSecurityConfig,
} from './biometricVaultTypes';
import {
  authenticateVault,
  enableVaultScreenProtection,
  getBiometricCapability,
} from './biometricVaultSecurity';
import { initializeVault, readVault, writeVault } from './biometricVaultRepository';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useBiometricVault(
  security: VaultSecurityConfig = DEFAULT_VAULT_SECURITY,
) {
  const [isReady, setIsReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [biometricStrong, setBiometricStrong] = useState(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = null;
  }, []);

  const lock = useCallback(() => {
    clearTimer();
    setIsUnlocked(false);
    setSessionExpiresAt(null);
    setItems([]);
  }, [clearTimer]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initializeVault();
        const capability = await getBiometricCapability();
        if (!cancelled) {
          setBiometricStrong(capability.securityLevel === 'strong');
          setIsReady(true);
        }
      } catch {
        if (!cancelled) setAuthError('Vault initialization failed.');
      }
    })();
    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [clearTimer]);

  const scheduleLock = useCallback(() => {
    clearTimer();
    if (security.autoLockSeconds <= 0) return;

    const expiresAt = Date.now() + security.autoLockSeconds * 1000;
    setSessionExpiresAt(expiresAt);
    lockTimer.current = setTimeout(lock, security.autoLockSeconds * 1000);
  }, [clearTimer, lock, security.autoLockSeconds]);

  const unlock = useCallback(async () => {
    setAuthError(null);
    await Haptics.selectionAsync();

    try {
      const result = await authenticateVault();
      if (!result.success) {
        const message =
          result.error === 'user_cancel'
            ? 'Authentication cancelled.'
            : result.error === 'not_enrolled'
              ? 'Set up a biometric credential on this device first.'
              : result.error === 'lockout'
                ? 'Biometric authentication is temporarily locked.'
                : 'Vault authentication failed.';
        setAuthError(message);
        return false;
      }

      const snapshot = await readVault();
      setItems(snapshot.items);
      setIsUnlocked(true);
      scheduleLock();
      await enableVaultScreenProtection();
      AccessibilityInfo.announceForAccessibility?.('Vault unlocked successfully');
      return true;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Vault unlock failed.');
      lock();
      return false;
    }
  }, [lock, scheduleLock]);

  const persist = useCallback(async (nextItems: VaultItem[]) => {
    await writeVault(nextItems);
    setItems(nextItems);
    scheduleLock();
  }, [scheduleLock]);

  const addItem = useCallback(async (item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const nextItem = { ...item, id: generateId(), createdAt: now, updatedAt: now } as VaultItem;
    await persist([nextItem, ...items]);
  }, [items, persist]);

  const updateItem = useCallback(async (item: VaultItem) => {
    const updated = { ...item, updatedAt: Date.now() } as VaultItem;
    await persist(items.map((current) => current.id === item.id ? updated : current));
  }, [items, persist]);

  const removeItem = useCallback(async (id: string) => {
    await persist(items.filter((item) => item.id !== id));
  }, [items, persist]);

  useEffect(() => {
    const onAppState = (nextState: AppStateStatus) => {
      if (!isUnlocked || !security.lockOnBackground) return;
      if (nextState !== 'active') lock();
    };

    const subscription = AppState.addEventListener('change', onAppState);
    return () => subscription.remove();
  }, [isUnlocked, lock, security.lockOnBackground]);

  return {
    isReady,
    isUnlocked,
    items,
    authError,
    sessionExpiresAt,
    biometricStrong,
    unlock,
    lock,
    addItem,
    updateItem,
    removeItem,
  };
}
