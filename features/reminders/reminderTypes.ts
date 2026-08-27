export type ReminderVoiceMode = 'piper' | 'system';
export type ReminderScheduleKind = 'delay' | 'at' | 'daily' | 'weekly' | 'interval';
export type ReminderItem = {
  id: string; title: string; body: string; delayMinutes: number; scheduledAt: string; scheduledFor: string;
  notificationId: string; language: string; voiceId?: string; scheduleKind: ReminderScheduleKind;
  repeatEveryMinutes?: number; weekdays?: number[]; enabled: boolean; createdAt: string; updatedAt?: string; snoozedUntil?: string;
};
export type ReminderDraft = {
  title: string; body: string; delayMinutes: string; language: 'en-US' | 'hi-IN'; voiceId?: string;
  scheduleKind?: ReminderScheduleKind; scheduledFor?: string; repeatEveryMinutes?: number; weekdays?: number[];
};
