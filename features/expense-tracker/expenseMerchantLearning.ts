import type { ExpenseCategory, ExpenseRecord } from './expenseTrackerTypes';
import { suggestExpenseCategory } from './expenseCategoryEngine';

export interface MerchantCorrection {
  merchantKey: string;
  category: ExpenseCategory;
  updatedAtMs: number;
}

export function normalizeMerchantKey(merchant: string | null): string | null {
  if (!merchant) return null;
  const normalized = merchant.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return normalized || null;
}

export function learnMerchantCorrection(corrections: MerchantCorrection[], merchant: string | null, category: ExpenseCategory): MerchantCorrection[] {
  const key = normalizeMerchantKey(merchant);
  if (!key) return corrections;
  const next = corrections.filter((item) => item.merchantKey !== key);
  next.push({ merchantKey: key, category, updatedAtMs: Date.now() });
  return next.slice(-500);
}

export function applyMerchantLearning(expense: ExpenseRecord, corrections: MerchantCorrection[]): ExpenseRecord {
  const key = normalizeMerchantKey(expense.merchantName);
  if (!key) return expense;
  const learned = corrections.find((item) => item.merchantKey === key);
  if (!learned) return expense;
  return {
    ...expense,
    category: learned.category,
    confidence: Math.max(expense.confidence, 0.95),
    isSavedCategory: false,
    updatedAtMs: Date.now(),
  };
}

export function explainCategoryDecision(merchant: string | null, corrections: MerchantCorrection[]): string {
  const key = normalizeMerchantKey(merchant);
  if (key && corrections.some((item) => item.merchantKey === key)) return 'Learned from your previous correction.';
  const suggestion = suggestExpenseCategory(merchant);
  return suggestion.category === 'other' ? 'Saved as Other because no reliable merchant pattern was found.' : `Detected from merchant pattern with ${Math.round(suggestion.confidence * 100)}% confidence.`;
}
