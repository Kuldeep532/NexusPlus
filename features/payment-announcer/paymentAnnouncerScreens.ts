export const PAYMENT_ANNOUNCER_ROUTES = {
  home: '/payment-announcer',
  payments: '/payment-announcer/payments',
  analytics: '/payment-announcer/analytics',
  businessSummary: '/payment-announcer/business-summary',
  announcementRules: '/payment-announcer/announcement-rules',
  voice: '/payment-announcer/voice',
  security: '/payment-announcer/security',
  settings: '/payment-announcer/settings',
} as const;

export type PaymentAnnouncerProtectedRoute = Exclude<keyof typeof PAYMENT_ANNOUNCER_ROUTES, 'home'>;
