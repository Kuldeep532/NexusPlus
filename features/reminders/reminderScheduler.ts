import * as Notifications from 'expo-notifications';
import type { ReminderDraft, ReminderItem, ReminderScheduleKind } from './reminderTypes';

export const REMINDER_CHANNEL_ID = 'nexus-reminders';
export const REMINDER_SOUND = 'notification';

export async function configureReminderNotifications(): Promise<void> {
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Nexus Reminders', importance: Notifications.AndroidImportance.MAX, sound: REMINDER_SOUND,
    vibrationPattern: [0, 300, 150, 300], lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

function normalizeKind(draft: ReminderDraft): ReminderScheduleKind { return draft.scheduleKind ?? 'delay'; }

export async function scheduleReminder(draft: ReminderDraft): Promise<ReminderItem> {
  if (!(await requestReminderPermission())) throw new Error('Notification permission is required for reminders.');
  const kind = normalizeKind(draft);
  const delayMinutes = Math.max(1, Number.parseInt(draft.delayMinutes, 10) || 5);
  const id = `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date();
  const target = draft.scheduledFor ? new Date(draft.scheduledFor) : new Date(Date.now() + delayMinutes * 60_000);
  let trigger: Notifications.NotificationTriggerInput;

  if (kind === 'delay') {
    trigger = { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delayMinutes * 60, repeats: false };
  } else if (kind === 'at') {
    trigger = { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target, repeats: false };
  } else if (kind === 'daily') {
    trigger = { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: target.getHours(), minute: target.getMinutes(), repeats: true };
  } else if (kind === 'weekly') {
    const weekdays = draft.weekdays?.length ? draft.weekdays : [target.getDay() || 7];
    trigger = { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: weekdays[0], hour: target.getHours(), minute: target.getMinutes(), repeats: true };
  } else {
    const interval = Math.max(1, draft.repeatEveryMinutes || delayMinutes);
    trigger = { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: interval * 60, repeats: true };
  }

  const title = draft.title.trim() || 'Nexus Reminder';
  const body = draft.body.trim() || 'Your reminder is ready.';
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: REMINDER_SOUND, data: { type: 'nexus-reminder', reminderId: id, title, body, language: draft.language, voiceId: draft.voiceId ?? null } },
    trigger,
  });

  const scheduledAt = kind === 'delay' || kind === 'interval' ? new Date(Date.now() + delayMinutes * 60_000) : target;
  return {
    id, title, body, delayMinutes,
    scheduledAt: scheduledAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
    scheduledFor: scheduledAt.toISOString(), notificationId, language: draft.language, voiceId: draft.voiceId,
    scheduleKind: kind, repeatEveryMinutes: kind === 'interval' ? Math.max(1, draft.repeatEveryMinutes || delayMinutes) : undefined,
    weekdays: draft.weekdays, enabled: true, createdAt: now.toISOString(),
  };
}

export async function cancelReminder(reminder: ReminderItem): Promise<void> { await Notifications.cancelScheduledNotificationAsync(reminder.notificationId); }
export async function rescheduleReminder(reminder: ReminderItem, draft: ReminderDraft): Promise<ReminderItem> {
  await cancelReminder(reminder); return scheduleReminder({ ...draft, scheduleKind: draft.scheduleKind ?? reminder.scheduleKind });
}
export async function listScheduledReminderNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}
