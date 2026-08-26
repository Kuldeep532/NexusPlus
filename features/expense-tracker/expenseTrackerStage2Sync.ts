import type { ExpenseRecord } from './expenseTrackerTypes';
import { createExpenseBackend, type AuthenticatedExpenseUser, type ExpenseSupabaseClient } from './expenseTrackerBackend';

export async function syncExpenseForUser(
  user: AuthenticatedExpenseUser,
  expense: ExpenseRecord,
  client?: ExpenseSupabaseClient | null,
): Promise<boolean> {
  if (!user.id || expense.userId !== user.id) return false;
  const backend = createExpenseBackend(client);
  try {
    await backend.saveExpense(expense);
    return true;
  } catch {
    return false;
  }
}
