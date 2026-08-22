export type PaymentStatus = 'received' | 'settled' | 'pending' | 'failed' | 'refunded';
export type PaymentDirection = 'incoming' | 'outgoing';

export interface BusinessPaymentRecord {
  id: string;
  eventId: string;
  timestampMs: number;
  senderDisplayName: string;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  direction: PaymentDirection;
  category?: string;
  note?: string;
  reference?: string;
}

export interface PaymentBusinessSummary {
  totalIncomingMinor: number;
  totalOutgoingMinor: number;
  successfulIncomingCount: number;
  pendingCount: number;
  refundedMinor: number;
  averageIncomingMinor: number;
  currency: string;
}

export interface PaymentAnnouncementRules {
  announceIncoming: boolean;
  announceSettledOnly: boolean;
  minimumAmountMinor: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  repeatCriticalAnnouncements: boolean;
}

export const DEFAULT_PAYMENT_ANNOUNCEMENT_RULES: PaymentAnnouncementRules = {
  announceIncoming: true,
  announceSettledOnly: false,
  minimumAmountMinor: 0,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  repeatCriticalAnnouncements: true,
};
