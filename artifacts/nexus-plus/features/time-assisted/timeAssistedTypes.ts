export type AnnouncementSettings = {
  enabled: boolean;
  intervalMinutes: 15 | 30 | 60;
  language: string;
  rate: number;
  pitch: number;
  voiceIdentifier?: string;
  includeDate: boolean;
  includeDay: boolean;
  soundEnabled: boolean;
};

export const DEFAULT_ANNOUNCEMENT_SETTINGS: AnnouncementSettings = {
  enabled: true,
  intervalMinutes: 30,
  language: 'en-IN',
  rate: 0.92,
  pitch: 1.0,
  includeDate: true,
  includeDay: true,
  soundEnabled: true,
};
