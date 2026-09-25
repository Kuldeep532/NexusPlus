import { scheduleReminder } from '@/features/reminders/reminderScheduler';

export async function scheduleEraRecommendationReminder(text: string): Promise<string> {
  const reminder = await scheduleReminder({
    title: 'Era AI • Spiritual Reminder',
    body: text,
    delayMinutes: 5,
    scheduledFor: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    language: 'hi',
    scheduleKind: 'at',
  });
  return reminder.notificationId;
}
