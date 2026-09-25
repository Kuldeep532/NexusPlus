export type EraLanguage = 'hi' | 'en';

export type EraMessage = {
  id: string;
  role: 'user' | 'era';
  text: string;
  language: EraLanguage;
  createdAt: number;
  context?: { chapter?: number; verse?: number; source?: 'gita' };
};

export type EraRecommendation = {
  id: string;
  title: string;
  body: string;
  action: 'open-gita' | 'reminder';
  chapter?: number;
  verse?: number;
  reminderText?: string;
};

export type EraHabitSignal = {
  id: string;
  label: string;
  description: string;
  count: number;
  lastSeenAt: number;
};

export type EraResponse = {
  text: string;
  language: EraLanguage;
  allowed: true;
  suggestions?: EraRecommendation[];
};
