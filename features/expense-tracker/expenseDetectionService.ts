import { suggestExpenseCategory, resolveSavedCategory } from './expenseCategoryEngine';
import type { ExpenseDetectionInput, ExpenseRecord } from './expenseTrackerTypes';

export interface ExpenseDetectionResult {
  expense: ExpenseRecord;
  duplicate: boolean;
}

export function buildExpenseFromTrustedPayment(input: ExpenseDetectionInput, userId: string, existingIds: Set<string>): ExpenseDetectionResult {
  const suggestion = resolveSavedCategory(suggestExpenseCategory(input.merchantText));
  const id = `expense_${input.source}_${input.sourceEventId}`.slice(0, 180);
  const duplicate = existingIds.has(input.sourceEventId) || existingIds.has(id);
  const now = Date.now();

  return {
    duplicate,
    expense: {
      id,
      userId,
      source: input.source,
      category: suggestion.category,
      merchantName: suggestion.merchantName,
      note: suggestion.merchantName ? `Detected from ${input.source}.` : `Detected from ${input.source}; category review recommended.`,
      amountMinor: input.amountMinor,
      currency: input.currency,
      occurredAtMs: input.occurredAtMs,
      externalTransactionId: input.sourceEventId,
      confidence: suggestion.confidence,
      isSavedCategory: suggestion.category === 'other',
      createdAtMs: now,
      updatedAtMs: now,
    },
  };
}

export function normalizeSmsForDetection(message: string): Pick<ExpenseDetectionInput, 'merchantText' | 'amountMinor' | 'currency'> | null {
  const amountMatch = message.match(/(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.\d{1,2})?)/i);
  if (!amountMatch) return null;
  const amount = Number(amountMatch[1].replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const merchantMatch = message.match(/(?:at|to|for|merchant)\s+([A-Za-z0-9&._' -]{2,80})/i);
  return {
    merchantText: merchantMatch?.[1]?.trim() ?? null,
    amountMinor: Math.round(amount * 100),
    currency: 'INR',
  };
}

/**
 * SMS access must be implemented with Android's runtime permission and a
 * dedicated receiver/adapter in a later native stage. This parser is deliberately
 * pure and does not grant the app SMS access by itself.
 */
