import * as Notifications from 'expo-notifications';
import type { ReminderItem } from './reminderTypes';
import { loadReminders, removeReminder, upsertReminder } from './reminderStore';
import { cancelReminder, listScheduledReminderNotifications } from './reminderScheduler';

export type ReminderBackendSnapshot = {
  reminders: ReminderItem[];
  scheduledNotificationIds: string[];
  reconciledAt: string;
};

/** Local reminder backend: persistence + OS scheduler reconciliation. */
export async function getReminderBackendSnapshot(): Promise<ReminderBackendSnapshot> {
  const [reminders, scheduled] = await Promise.all([loadReminders(), listScheduledReminderNotifications()]);
  return { reminders, scheduledNotificationIds: scheduled.map((item) => item.identifier), reconciledAt: new Date().toISOString() };
}

export async function reconcileReminderBackend(): Promise<ReminderItem[]> {
  const reminders = await loadReminders();
  const scheduled = await listScheduledReminderNotifications();
  const scheduledIds = new Set(scheduled.map((item) => item.identifier));
  const active = reminders.filter((item) => !item.enabled || scheduledIds.has(item.notificationId) || item.scheduleKind === 'delay' || item.scheduleKind === 'at');
  if (active.length !== reminders.length) await Promise.all(reminders.filter((item) => !active.some((a) => a.id === item.id)).map((item) => removeReminder(item.id)));
  return active;
}

export async function disableReminder(reminder: ReminderItem): Promise<ReminderItem[]> {
  await cancelReminder(reminder);
  return removeReminder(reminder.id);
}

export async function registerReminder(reminder: ReminderItem): Promise<ReminderItem[]> { return upsertReminder(reminder); }

export async function getPendingReminderCount(): Promise<number> {
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  return requests.filter((request) => (request.content.data as { type?: string })?.type === 'nexus-reminder').length;
}
