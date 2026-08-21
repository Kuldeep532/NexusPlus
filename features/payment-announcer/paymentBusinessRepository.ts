import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BusinessPaymentRecord, PaymentAnnouncementRules } from './paymentBusinessTypes';
import { DEFAULT_PAYMENT_ANNOUNCEMENT_RULES } from './paymentBusinessTypes';

const PAYMENTS_KEY = 'nexus-plus.payment-announcer.business-payments.v1';
const RULES_KEY = 'nexus-plus.payment-announcer.announcement-rules.v1';
const MAX_RECORDS = 5000;

export async function loadBusinessPayments(): Promise<BusinessPaymentRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(PAYMENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-MAX_RECORDS) as BusinessPaymentRecord[];
  } catch {
    return [];
  }
}

export async function saveBusinessPayment(record: BusinessPaymentRecord): Promise<void> {
  const current = await loadBusinessPayments();
  const withoutDuplicate = current.filter((item) => item.eventId !== record.eventId);
  const next = [...withoutDuplicate, record].slice(-MAX_RECORDS);
  await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(next));
}

export async function loadPaymentAnnouncementRules(): Promise<PaymentAnnouncementRules> {
  try {
    const raw = await AsyncStorage.getItem(RULES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...DEFAULT_PAYMENT_ANNOUNCEMENT_RULES,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
      minimumAmountMinor: Math.max(0, Number(parsed?.minimumAmountMinor ?? 0) || 0),
    };
  } catch {
    return DEFAULT_PAYMENT_ANNOUNCEMENT_RULES;
  }
}

export async function savePaymentAnnouncementRules(rules: PaymentAnnouncementRules): Promise<void> {
  await AsyncStorage.setItem(RULES_KEY, JSON.stringify({
    ...rules,
    minimumAmountMinor: Math.max(0, Math.round(rules.minimumAmountMinor)),
  }));
}
