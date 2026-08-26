import type { Href } from 'expo-router';

export interface FinancialHomeFeature {
  id: 'payment-announcer' | 'expense-tracker';
  title: string;
  description: string;
  icon: string;
  route: Href;
  security: 'biometric';
}

export const FINANCIAL_HOME_FEATURES: FinancialHomeFeature[] = [
  {
    id: 'payment-announcer',
    title: 'Payment Announcer',
    description: 'Securely announce incoming payments and manage payment alerts.',
    icon: 'volume-2',
    route: '/payment-announcer',
    security: 'biometric',
  },
  {
    id: 'expense-tracker',
    title: 'Expense Tracker',
    description: 'Track expenses manually or from trusted payment and SMS detections.',
    icon: 'credit-card',
    route: '/expense-tracker',
    security: 'biometric',
  },
];

export function getFinancialHomeFeature(id: FinancialHomeFeature['id']): FinancialHomeFeature {
  const feature = FINANCIAL_HOME_FEATURES.find((item) => item.id === id);
  if (!feature) throw new Error(`Unknown financial home feature: ${id}`);
  return feature;
}
