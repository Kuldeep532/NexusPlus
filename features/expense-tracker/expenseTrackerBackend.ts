import type { ExpenseRecord } from './expenseTrackerTypes';
import { expenseFromSupabaseRow, expenseToSupabaseRow, type ExpenseBackend, type ExpenseSupabaseRow, UnconfiguredExpenseBackend } from './expenseTrackerSync';

export interface AuthenticatedExpenseUser {
  id: string;
}

export interface ExpenseSupabaseClient {
  from(table: string): {
    upsert(value: ExpenseSupabaseRow, options?: { onConflict?: string }): Promise<{ error: Error | null }>;
    select(): { eq(column: string, value: string): Promise<{ data: ExpenseSupabaseRow[] | null; error: Error | null }> };
  };
}

export class SupabaseExpenseBackend implements ExpenseBackend {
  constructor(private readonly client: ExpenseSupabaseClient) {}

  async saveExpense(expense: ExpenseRecord): Promise<void> {
    const row = expenseToSupabaseRow(expense);
    const result = await this.client.from('expenses').upsert(row, { onConflict: 'user_id,external_transaction_id' });
    if (result.error) throw result.error;
  }

  async listExpenses(userId: string): Promise<ExpenseRecord[]> {
    const result = await this.client.from('expenses').select().eq('user_id', userId);
    if (result.error) throw result.error;
    return (result.data ?? []).map(expenseFromSupabaseRow);
  }
}

export function createExpenseBackend(client?: ExpenseSupabaseClient | null): ExpenseBackend {
  return client ? new SupabaseExpenseBackend(client) : new UnconfiguredExpenseBackend();
}
