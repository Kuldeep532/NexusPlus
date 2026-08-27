import * as Notifications from 'expo-notifications';
import type { ReminderItem } from './reminderTypes';
import { loadReminders, removeReminder, saveReminders, upsertReminder } from './reminderStore';
import { cancelReminder, scheduleReminder } from './reminderScheduler';

export type ReminderBackendSnapshot = { reminders: ReminderItem[]; scheduledNotificationIds: string[]; reconciledAt: string };

export async function getReminderBackendSnapshot(): Promise<ReminderBackendSnapshot> {
  const [reminders, scheduled] = await Promise.all([loadReminders(), Notifications.getAllScheduledNotificationsAsync()]);
  return { reminders, scheduledNotificationIds: scheduled.map((item) => item.identifier), reconciledAt: new Date().toISOString() };
}

export async function reconcileReminderBackend(): Promise<ReminderItem[]> {
  const reminders = await loadReminders();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = new Set(scheduled.map((item) => item.identifier));
  const now = Date.now();
  const next = reminders.filter((item) => {
    if (!item.enabled) return true;
    if (ids.has(item.notificationId)) return true;
    if (item.scheduleKind === 'daily' || item.scheduleKind === 'weekly' || item.scheduleKind === 'interval') return true;
    return new Date(item.scheduledFor).getTime() > now;
  });
  await saveReminders(next);
  return next;
}

export async function setReminderEnabled(reminder: ReminderItem, enabled: boolean): Promise<ReminderItem[]> {
  if (!enabled) { await cancelReminder(reminder); return upsertReminder({ ...reminder, enabled: false }); }
  const restored = await scheduleReminder({ title: reminder.title, body: reminder.body, delayMinutes: String(Math.max(1, reminder.delayMinutes)), language: reminder.language as 'en-US' | 'hi-IN', voiceId: reminder.voiceId, scheduleKind: reminder.scheduleKind, scheduledFor: reminder.scheduledFor, repeatEveryMinutes: reminder.repeatEveryMinutes, weekdays: reminder.weekdays });
  return upsertReminder({ ...restored, id: reminder.id, createdAt: reminder.createdAt, enabled: true });
}

export async function snoozeReminder(reminder: ReminderItem, minutes = 10): Promise<ReminderItem[]> {
  await cancelReminder(reminder);
  const restored = await scheduleReminder({ title: reminder.title, body: reminder.body, delayMinutes: String(Math.max(1, minutes)), language: reminder.language as 'en-US' | 'hi-IN', voiceId: reminder.voiceId, scheduleKind: 'delay' });
  return upsertReminder({ ...restored, id: reminder.id, createdAt: reminder.createdAt, enabled: true });
}

export async function disableReminder(reminder: ReminderItem): Promise<ReminderItem[]> { return setReminderEnabled(reminder, false); }
export async function registerReminder(reminder: ReminderItem): Promise<ReminderItem[]> { return upsertReminder(reminder); }
export async function deleteReminder(reminder: ReminderItem): Promise<ReminderItem[]> { await cancelReminder(reminder); return removeReminder(reminder.id); }
export async function getPendingReminderCount(): Promise<number> {
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  return requests.filter((request) => (request.content.data as { type?: string })?.type === 'nexus-reminder').length;
}
