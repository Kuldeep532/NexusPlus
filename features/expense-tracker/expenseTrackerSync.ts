import type { ExpenseRecord } from './expenseTrackerTypes';

export interface ExpenseBackend {
  saveExpense(expense: ExpenseRecord): Promise<void>;
  listExpenses(userId: string): Promise<ExpenseRecord[]>;
}

/**
 * Stage 1 keeps the backend contract explicit and fail-closed. Real Supabase
 * credentials/session wiring is supplied by the app auth boundary and must
 * never be fabricated in source control.
 */
export class UnconfiguredExpenseBackend implements ExpenseBackend {
  async saveExpense(_expense: ExpenseRecord): Promise<void> {
    throw new Error('Expense Tracker backend is not configured.');
  }

  async listExpenses(_userId: string): Promise<ExpenseRecord[]> {
    throw new Error('Expense Tracker backend is not configured.');
  }
}

export interface ExpenseSupabaseRow {
  id: string;
  user_id: string;
  source: string;
  category: string;
  merchant_name: string | null;
  note: string | null;
  amount_minor: number;
  currency: string;
  occurred_at_ms: number;
  external_transaction_id: string | null;
  confidence: number;
  is_saved_category: boolean;
  created_at_ms: number;
  updated_at_ms: number;
}

export function expenseToSupabaseRow(expense: ExpenseRecord): ExpenseSupabaseRow {
  return {
    id: expense.id,
    user_id: expense.userId,
    source: expense.source,
    category: expense.category,
    merchant_name: expense.merchantName,
    note: expense.note,
    amount_minor: expense.amountMinor,
    currency: expense.currency,
    occurred_at_ms: expense.occurredAtMs,
    external_transaction_id: expense.externalTransactionId,
    confidence: expense.confidence,
    is_saved_category: expense.isSavedCategory,
    created_at_ms: expense.createdAtMs,
    updated_at_ms: expense.updatedAtMs,
  };
}

export function expenseFromSupabaseRow(row: ExpenseSupabaseRow): ExpenseRecord {
  return {
    id: row.id,
    userId: row.user_id,
    source: row.source as ExpenseRecord['source'],
    category: row.category as ExpenseRecord['category'],
    merchantName: row.merchant_name,
    note: row.note,
    amountMinor: row.amount_minor,
    currency: row.currency,
    occurredAtMs: row.occurred_at_ms,
    externalTransactionId: row.external_transaction_id,
    confidence: row.confidence,
    isSavedCategory: row.is_saved_category,
    createdAtMs: row.created_at_ms,
    updatedAtMs: row.updated_at_ms,
  };
}
