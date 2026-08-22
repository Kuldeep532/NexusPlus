import type { PaymentEvent } from './paymentEvent';

export type PaymentDirection = 'incoming' | 'outgoing';
export type PaymentCategory =
  | 'sale'
  | 'refund'
  | 'expense'
  | 'transfer'
  | 'fee'
  | 'other';

export interface BusinessPaymentRecord extends PaymentEvent {
  direction: PaymentDirection;
  category: PaymentCategory;
  reference?: string;
  note?: string;
}

export interface PaymentBusinessSummary {
  incomingMinor: number;
  outgoingMinor: number;
  settledIncomingMinor: number;
  pendingIncomingMinor: number;
  refundsMinor: number;
  feesMinor: number;
  transactionCount: number;
}

export function summarizePayments(records: BusinessPaymentRecord[]): PaymentBusinessSummary {
  const summary: PaymentBusinessSummary = {
    incomingMinor: 0,
    outgoingMinor: 0,
    settledIncomingMinor: 0,
    pendingIncomingMinor: 0,
    refundsMinor: 0,
    feesMinor: 0,
    transactionCount: records.length,
  };

  for (const record of records) {
    if (record.direction === 'incoming') {
      summary.incomingMinor += record.amountMinor;
      if (record.status === 'settled') summary.settledIncomingMinor += record.amountMinor;
      else summary.pendingIncomingMinor += record.amountMinor;
    } else {
      summary.outgoingMinor += record.amountMinor;
    }

    if (record.category === 'refund') summary.refundsMinor += record.amountMinor;
    if (record.category === 'fee') summary.feesMinor += record.amountMinor;
  }

  return summary;
}

export function getDailyTotals(records: BusinessPaymentRecord[]): Array<{ day: string; incomingMinor: number; outgoingMinor: number }> {
  const totals = new Map<string, { incomingMinor: number; outgoingMinor: number }>();
  for (const record of records) {
    const day = new Date(record.timestampMs).toISOString().slice(0, 10);
    const current = totals.get(day) ?? { incomingMinor: 0, outgoingMinor: 0 };
    if (record.direction === 'incoming') current.incomingMinor += record.amountMinor;
    else current.outgoingMinor += record.amountMinor;
    totals.set(day, current);
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => ({ day, ...value }));
}

export function filterPayments(
  records: BusinessPaymentRecord[],
  filters: { status?: PaymentEvent['status']; category?: PaymentCategory; direction?: PaymentDirection; query?: string },
): BusinessPaymentRecord[] {
  const query = filters.query?.trim().toLowerCase() ?? '';
  return records.filter((record) => {
    if (filters.status && record.status !== filters.status) return false;
    if (filters.category && record.category !== filters.category) return false;
    if (filters.direction && record.direction !== filters.direction) return false;
    if (query) {
      const haystack = [record.senderDisplayName, record.reference, record.note, record.currency]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}
