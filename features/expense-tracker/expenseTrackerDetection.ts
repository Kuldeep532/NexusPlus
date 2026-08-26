import type { ExpenseDetectionInput, ExpenseRecord } from './expenseTrackerTypes';
import { suggestExpenseCategory } from './expenseCategoryEngine';

export function buildDetectedExpense(input: ExpenseDetectionInput, userId: string, now = Date.now()): ExpenseRecord {
  const suggestion = suggestExpenseCategory(input.merchantText);
  return {
    id: `expense_${input.source}_${input.sourceEventId}`,
    userId,
    source: input.source,
    category: suggestion.category,
    merchantName: suggestion.merchantName,
    note: input.merchantText,
    amountMinor: input.amountMinor,
    currency: input.currency,
    occurredAtMs: input.occurredAtMs,
    externalTransactionId: input.sourceEventId,
    confidence: suggestion.confidence,
    isSavedCategory: suggestion.category === 'other' || suggestion.confidence < 0.6,
    createdAtMs: now,
    updatedAtMs: now,
  };
}

export function isDuplicateExpense(existing: ExpenseRecord[], candidate: ExpenseRecord): boolean {
  return existing.some((expense) =>
    Boolean(candidate.externalTransactionId) &&
    expense.externalTransactionId === candidate.externalTransactionId &&
    expense.amountMinor === candidate.amountMinor &&
    expense.currency === candidate.currency,
  );
}
