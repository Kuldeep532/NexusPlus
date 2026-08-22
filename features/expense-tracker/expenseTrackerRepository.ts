import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExpenseRecord } from './expenseTrackerTypes';

const EXPENSES_KEY = 'nexus-plus.expense-tracker.expenses.v1';

function sanitizeExpense(input: Partial<ExpenseRecord>): ExpenseRecord | null {
  if (!input.id || !input.userId || !input.currency || !input.amountMinor || !input.occurredAtMs || !input.category) return null;
  if (!Number.isInteger(input.amountMinor) || input.amountMinor < 0) return null;
  return {
    id: String(input.id).slice(0, 128),
    userId: String(input.userId).slice(0, 128),
    source: input.source ?? 'manual',
    category: input.category,
    merchantName: input.merchantName ? String(input.merchantName).slice(0, 120) : null,
    note: input.note ? String(input.note).slice(0, 500) : null,
    amountMinor: input.amountMinor,
    currency: String(input.currency).toUpperCase().slice(0, 3),
    occurredAtMs: input.occurredAtMs,
    externalTransactionId: input.externalTransactionId ? String(input.externalTransactionId).slice(0, 160) : null,
    confidence: Math.min(1, Math.max(0, Number(input.confidence ?? 0))),
    isSavedCategory: Boolean(input.isSavedCategory),
    createdAtMs: input.createdAtMs ?? Date.now(),
    updatedAtMs: input.updatedAtMs ?? Date.now(),
  };
}

export async function loadLocalExpenses(userId: string): Promise<ExpenseRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(EXPENSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizeExpense(item))
      .filter((item): item is ExpenseRecord => Boolean(item && item.userId === userId));
  } catch {
    return [];
  }
}

export async function saveLocalExpenses(expenses: ExpenseRecord[]): Promise<void> {
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}
