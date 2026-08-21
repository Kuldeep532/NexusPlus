export type PaymentAnnouncementTtsProvider = 'pytts-voice-sheet' | 'android-default';

export interface PaymentAnnouncerSettings {
  enabled: boolean;
  preferredTtsProvider: PaymentAnnouncementTtsProvider;
  speechRate: number;
  speechPitch: number;
  autoLockSeconds: number;
}

export const DEFAULT_PAYMENT_ANNOUNCER_SETTINGS: PaymentAnnouncerSettings = {
  enabled: true,
  preferredTtsProvider: 'pytts-voice-sheet',
  speechRate: 1,
  speechPitch: 1,
  autoLockSeconds: 30,
};
