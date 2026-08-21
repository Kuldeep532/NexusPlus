export type WorldClockCity = {
  id: string;
  city: string;
  country: string;
  timeZone: string;
};

export type Alarm = {
  id: string;
  hour: number;
  minute: number;
  label: string;
  enabled: boolean;
  weekdays: number[];
  notificationId?: string;
};

export type TimeAnnouncementSettings = {
  enabled: boolean;
  intervalMinutes: 15 | 30 | 60;
  language: string;
  voiceIdentifier?: string;
  rate: number;
  pitch: number;
};

export const DEFAULT_WORLD_CLOCKS: WorldClockCity[] = [
  { id: 'new-york', city: 'New York', country: 'United States', timeZone: 'America/New_York' },
  { id: 'london', city: 'London', country: 'United Kingdom', timeZone: 'Europe/London' },
  { id: 'dubai', city: 'Dubai', country: 'United Arab Emirates', timeZone: 'Asia/Dubai' },
  { id: 'singapore', city: 'Singapore', country: 'Singapore', timeZone: 'Asia/Singapore' },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { id: 'sydney', city: 'Sydney', country: 'Australia', timeZone: 'Australia/Sydney' },
];
