export type ReminderVoiceMode = 'piper' | 'system';

export type ReminderItem = {
  id: string;
  title: string;
  body: string;
  delayMinutes: number;
  scheduledAt: string;
  notificationId: string;
  language: string;
  voiceId?: string;
};

export type ReminderDraft = {
  title: string;
  body: string;
  delayMinutes: string;
  language: 'en-US' | 'hi-IN';
  voiceId?: string;
};
