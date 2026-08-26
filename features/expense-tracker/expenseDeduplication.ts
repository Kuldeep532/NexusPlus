import type { ExpenseRecord } from './expenseTrackerTypes';

export function buildExpenseIdentity(expense: Pick<ExpenseRecord, 'userId' | 'source' | 'externalTransactionId' | 'amountMinor' | 'currency' | 'occurredAtMs'>): string {
  const external = expense.externalTransactionId?.trim();
  if (external) return `${expense.userId}:${expense.source}:${external}`;
  return `${expense.userId}:${expense.source}:${expense.amountMinor}:${expense.currency}:${expense.occurredAtMs}`;
}

export function deduplicateExpenses(expenses: ExpenseRecord[]): ExpenseRecord[] {
  const byIdentity = new Map<string, ExpenseRecord>();
  for (const expense of expenses) {
    const key = buildExpenseIdentity(expense);
    const existing = byIdentity.get(key);
    if (!existing || expense.updatedAtMs >= existing.updatedAtMs) byIdentity.set(key, expense);
  }
  return Array.from(byIdentity.values()).sort((a, b) => b.occurredAtMs - a.occurredAtMs);
}
