import { AppState, type AppStateStatus, AccessibilityInfo } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { authenticateExpenseTracker, disableExpenseScreenProtection, enableExpenseScreenProtection, isExpenseBiometricAvailable } from './expenseTrackerSecurity';
import { loadLocalExpenses, saveLocalExpenses } from './expenseTrackerRepository';
import { suggestExpenseCategory } from './expenseCategoryEngine';
import type { ExpenseCategory, ExpenseRecord } from './expenseTrackerTypes';

const AUTO_LOCK_MS = 60_000;

export function useExpenseTracker(userId: string | null) {
  const [isReady, setIsReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = null;
  }, []);

  const lock = useCallback(async () => {
    clearTimer();
    setIsUnlocked(false);
    try { await disableExpenseScreenProtection(); } catch { /* security teardown must not crash */ }
  }, [clearTimer]);

  const scheduleLock = useCallback(() => {
    clearTimer();
    lockTimer.current = setTimeout(() => { void lock(); }, AUTO_LOCK_MS);
  }, [clearTimer, lock]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const available = await isExpenseBiometricAvailable();
        const local = userId ? await loadLocalExpenses(userId) : [];
        if (cancelled) return;
        setBiometricAvailable(available);
        setExpenses(local);
        setIsReady(true);
      } catch {
        if (!cancelled) {
          setError('Expense Tracker security initialization failed.');
          setIsReady(true);
        }
      }
    })();
    return () => { cancelled = true; clearTimer(); };
  }, [clearTimer, userId]);

  const unlock = useCallback(async () => {
    setError(null);
    if (!biometricAvailable) {
      setError('A strong biometric enrolled in Biometric Vault is required.');
      return false;
    }
    const ok = await authenticateExpenseTracker();
    if (!ok) {
      setError('Biometric authentication failed or was cancelled.');
      return false;
    }
    await enableExpenseScreenProtection();
    setIsUnlocked(true);
    scheduleLock();
    AccessibilityInfo.announceForAccessibility?.('Expense Tracker unlocked');
    return true;
  }, [biometricAvailable, scheduleLock]);

  const addManualExpense = useCallback(async (input: {
    amountMinor: number;
    currency: string;
    category: ExpenseCategory | null;
    merchantName?: string | null;
    note?: string | null;
    occurredAtMs?: number;
  }) => {
    if (!isUnlocked || !userId) return false;
    const merchant = input.merchantName?.trim() || null;
    const suggestion = merchant ? suggestExpenseCategory(merchant) : null;
    const category = input.category ?? suggestion?.category ?? 'other';
    const now = Date.now();
    const expense: ExpenseRecord = {
      id: `manual_${now}_${Math.random().toString(36).slice(2, 10)}`,
      userId,
      source: category === 'other' && !merchant ? 'saved-category' : 'manual',
      category,
      merchantName: merchant,
      note: input.note?.trim() || null,
      amountMinor: Math.max(0, Math.trunc(input.amountMinor)),
      currency: input.currency.toUpperCase().slice(0, 3),
      occurredAtMs: input.occurredAtMs ?? now,
      externalTransactionId: null,
      confidence: input.category || !suggestion ? 1 : suggestion.confidence,
      isSavedCategory: category === 'other',
      createdAtMs: now,
      updatedAtMs: now,
    };
    const next = [expense, ...expenses];
    await saveLocalExpenses(next);
    setExpenses(next);
    scheduleLock();
    return true;
  }, [expenses, isUnlocked, scheduleLock, userId]);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next !== 'active' && isUnlocked) void lock();
    };
    const subscription = AppState.addEventListener('change', onAppState);
    return () => subscription.remove();
  }, [isUnlocked, lock]);

  return {
    isReady,
    isUnlocked,
    biometricAvailable,
    expenses,
    error,
    unlock,
    lock,
    addManualExpense,
  };
}
