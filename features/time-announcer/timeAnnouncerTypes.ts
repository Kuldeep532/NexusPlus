export type WorldClockCity = {
  id: string;
  city: string;
  country: string;
  timeZone: string;
};

export type AlarmSound = {
  id: string;
  fileName: string;
  displayName: string;
};

export const ALARM_SOUNDS: AlarmSound[] = [
  { id: 'first-light-at-the-brook', fileName: 'first_light_at_the_brook.mp3', displayName: 'First Light at the Brook' },
  { id: 'first-light-by-the-river', fileName: 'first_light_by_the_river.mp3', displayName: 'First Light by the River' },
  { id: 'lotus-petal-drift', fileName: 'lotus_petal_drift.mp3', displayName: 'Lotus Petal Drift' },
  { id: 'before-the-meadow-stirs', fileName: 'before_the_meadow_stirs.mp3', displayName: 'Before the Meadow Stirs' },
  { id: 'shoreline-awakening', fileName: 'shoreline_awakening.mp3', displayName: 'Shoreline Awakening' },
  { id: 'tides-at-daybreak', fileName: 'tides_at_daybreak.mp3', displayName: 'Tides at Daybreak' },
];

export type Alarm = {
  id: string;
  hour: number;
  minute: number;
  label: string;
  enabled: boolean;
  weekdays: number[];
  notificationId?: string;
  soundId: string;
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
