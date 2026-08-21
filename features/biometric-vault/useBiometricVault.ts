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
  enrollStrongBiometric,
  getBiometricCapability,
  loadVaultCredentialMode,
  saveVaultCredentialMode,
  type VaultCredentialMode,
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
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [credentialMode, setCredentialMode] = useState<VaultCredentialMode>('biometric-only');
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
        const [capability, mode] = await Promise.all([
          getBiometricCapability(),
          loadVaultCredentialMode(),
        ]);
        if (!cancelled) {
          setBiometricStrong(capability.securityLevel === 'strong');
          setBiometricEnrolled(capability.enrolled && capability.securityLevel === 'strong');
          setCredentialMode(mode);
          setIsReady(true);
        }
      } catch {
        if (!cancelled) {
          setAuthError('Vault initialization failed.');
          setIsReady(true);
        }
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

  const enrollBiometric = useCallback(async () => {
    setAuthError(null);
    try {
      const capability = await getBiometricCapability();
      if (!capability.hardware || capability.securityLevel !== 'strong') {
        setAuthError('A strong biometric is not available on this device.');
        return false;
      }

      if (!capability.enrolled) {
        setAuthError('No supported biometric is enrolled on this device.');
        return false;
      }

      const success = await enrollStrongBiometric();
      if (!success) {
        setAuthError('Biometric registration was cancelled or unavailable.');
        return false;
      }
      const refreshed = await getBiometricCapability();
      setBiometricStrong(refreshed.securityLevel === 'strong');
      setBiometricEnrolled(refreshed.enrolled && refreshed.securityLevel === 'strong');
      await saveVaultCredentialMode('biometric-only');
      setCredentialMode('biometric-only');
      AccessibilityInfo.announceForAccessibility?.('Vault biometric registered successfully');
      return true;
    } catch {
      setAuthError('Biometric registration failed.');
      return false;
    }
  }, []);

  const setDeviceAuthMode = useCallback(async () => {
    setAuthError(null);
    try {
      const capability = await getBiometricCapability();
      if (!capability.deviceCredentialAvailable) {
        setAuthError('A device PIN, pattern, or password is not available.');
        return false;
      }
      await saveVaultCredentialMode('device-auth');
      setCredentialMode('device-auth');
      AccessibilityInfo.announceForAccessibility?.('Vault device authentication mode selected');
      return true;
    } catch {
      setAuthError('Could not change Vault credential mode.');
      return false;
    }
  }, []);

  const unlock = useCallback(async () => {
    setAuthError(null);
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics are optional and must never block authentication.
    }

    try {
      const capability = await getBiometricCapability();
      if (credentialMode === 'biometric-only' &&
          (!capability.hardware || capability.securityLevel !== 'strong' || !capability.enrolled)) {
        setAuthError('A strong enrolled biometric is required to unlock the Vault.');
        return false;
      }
      if (credentialMode === 'device-auth' && !capability.deviceCredentialAvailable &&
          (!capability.hardware || capability.securityLevel !== 'strong' || !capability.enrolled)) {
        setAuthError('No supported device authentication is available.');
        return false;
      }

      const result = await authenticateVault('Unlock Nexus Biometric Vault', credentialMode);
      if (!result.success) {
        const message =
          result.error === 'user_cancel'
            ? 'Authentication cancelled.'
            : result.error === 'lockout'
              ? 'Biometric authentication is temporarily locked.'
              : result.error === 'credential_unavailable' || result.error === 'biometric_unavailable'
                ? 'The required device authentication is not available.'
                : 'Vault authentication failed.';
        setAuthError(message);
        return false;
      }

      const snapshot = await readVault();
      await enableVaultScreenProtection();
      setItems(snapshot.items);
      setIsUnlocked(true);
      scheduleLock();
      AccessibilityInfo.announceForAccessibility?.('Vault unlocked successfully');
      return true;
    } catch {
      lock();
      setAuthError('Vault unlock failed. Your vault remains locked.');
      return false;
    }
  }, [credentialMode, lock, scheduleLock]);

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
    biometricEnrolled,
    credentialMode,
    enrollBiometric,
    setDeviceAuthMode,
    unlock,
    lock,
    addItem,
    updateItem,
    removeItem,
  };
}
