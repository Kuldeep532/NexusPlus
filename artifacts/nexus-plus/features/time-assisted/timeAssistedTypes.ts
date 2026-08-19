export type TimeAssistedTool =
  | 'clock'
  | 'announcement'
  | 'interval'
  | 'stopwatch'
  | 'alarm'
  | 'time-difference';

export type WorldClock = {
  id: string;
  city: string;
  country: string;
  timeZone: string;
};

export const DEFAULT_WORLD_CLOCKS: WorldClock[] = [
  { id: 'delhi', city: 'New Delhi', country: 'India', timeZone: 'Asia/Kolkata' },
  { id: 'london', city: 'London', country: 'United Kingdom', timeZone: 'Europe/London' },
  { id: 'new-york', city: 'New York', country: 'United States', timeZone: 'America/New_York' },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { id: 'sydney', city: 'Sydney', country: 'Australia', timeZone: 'Australia/Sydney' },
];

export type AnnouncementSettings = {
  enabled: boolean;
  intervalMinutes: 15 | 30 | 60;
  language: string;
  rate: number;
  pitch: number;
  voiceIdentifier?: string;
  includeDate: boolean;
  includeDay: boolean;
};

export const DEFAULT_ANNOUNCEMENT_SETTINGS: AnnouncementSettings = {
  enabled: true,
  intervalMinutes: 30,
  language: 'en-IN',
  rate: 0.92,
  pitch: 1.0,
  includeDate: true,
  includeDay: true,
};
