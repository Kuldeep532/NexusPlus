export type ExpenseSource =
  | 'manual'
  | 'payment-announcer'
  | 'sms'
  | 'saved-category';

export type ExpenseCategory =
  | 'groceries'
  | 'food-dining'
  | 'tea-coffee'
  | 'transport'
  | 'fuel'
  | 'shopping'
  | 'bills-utilities'
  | 'rent-housing'
  | 'healthcare'
  | 'education'
  | 'entertainment'
  | 'travel'
  | 'subscriptions'
  | 'personal-care'
  | 'electronics'
  | 'gifts'
  | 'insurance'
  | 'investments'
  | 'taxes'
  | 'fees-charges'
  | 'cash-withdrawal'
  | 'other';

export interface ExpenseRecord {
  id: string;
  userId: string;
  source: ExpenseSource;
  category: ExpenseCategory;
  merchantName: string | null;
  note: string | null;
  amountMinor: number;
  currency: string;
  occurredAtMs: number;
  externalTransactionId: string | null;
  confidence: number;
  isSavedCategory: boolean;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ExpenseDetectionInput {
  source: Exclude<ExpenseSource, 'manual' | 'saved-category'>;
  sourceEventId: string;
  amountMinor: number;
  currency: string;
  occurredAtMs: number;
  merchantText: string | null;
  rawTextFingerprint: string | null;
}

export interface ExpenseCategorySuggestion {
  category: ExpenseCategory;
  merchantName: string | null;
  confidence: number;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  groceries: 'Groceries',
  'food-dining': 'Food & Dining',
  'tea-coffee': 'Tea & Coffee',
  transport: 'Transport',
  fuel: 'Fuel',
  shopping: 'Shopping',
  'bills-utilities': 'Bills & Utilities',
  'rent-housing': 'Rent & Housing',
  healthcare: 'Healthcare',
  education: 'Education',
  entertainment: 'Entertainment',
  travel: 'Travel',
  subscriptions: 'Subscriptions',
  'personal-care': 'Personal Care',
  electronics: 'Electronics',
  gifts: 'Gifts',
  insurance: 'Insurance',
  investments: 'Investments',
  taxes: 'Taxes',
  'fees-charges': 'Fees & Charges',
  'cash-withdrawal': 'Cash Withdrawal',
  other: 'Other',
};

export const DEFAULT_EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];
