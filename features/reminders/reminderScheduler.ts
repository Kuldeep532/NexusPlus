import * as Notifications from 'expo-notifications';
import type { ReminderDraft, ReminderItem, ReminderScheduleKind } from './reminderTypes';

export const REMINDER_CHANNEL_ID = 'nexus-reminders';
export const REMINDER_SOUND = 'notification';

export async function configureReminderNotifications() {
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Nexus Reminders',
    importance: Notifications.AndroidImportance.MAX,
    sound: REMINDER_SOUND,
    vibrationPattern: [0, 300, 150, 300],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function requestReminderPermission() {
  const c = await Notifications.getPermissionsAsync();
  if (c.granted) return true;
  const n = await Notifications.requestPermissionsAsync();
  return n.granted;
}

function kind(draft: ReminderDraft): ReminderScheduleKind {
  return draft.scheduleKind ?? 'delay';
}

export async function scheduleReminder(draft: ReminderDraft): Promise<ReminderItem> {
  if (!(await requestReminderPermission())) throw new Error('Notification permission is required for reminders.');
  const k = kind(draft);
  const delay = Math.max(1, Number.parseInt(draft.delayMinutes, 10) || 5);
  const id = `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date();
  const target = draft.scheduledFor ? new Date(draft.scheduledFor) : new Date(Date.now() + delay * 60000);
  if (Number.isNaN(target.getTime())) throw new Error('Invalid reminder time.');

  let trigger: Notifications.SchedulableNotificationTriggerInput;
  if (k === 'delay') {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delay * 60,
      repeats: false,
    };
  } else if (k === 'at') {
    if (target.getTime() <= Date.now()) throw new Error('Choose a future time for this reminder.');
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: target,
    };
  } else if (k === 'daily') {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: target.getHours(),
      minute: target.getMinutes(),
    };
  } else if (k === 'weekly') {
    const weekdays = draft.weekdays?.length ? draft.weekdays : [target.getDay() === 0 ? 1 : target.getDay() + 1];
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: weekdays[0],
      hour: target.getHours(),
      minute: target.getMinutes(),
    };
  } else {
    const interval = Math.max(1, draft.repeatEveryMinutes || delay);
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: interval * 60,
      repeats: true,
    };
  }

  const title = draft.title.trim() || 'Nexus Reminder';
  const body = draft.body.trim() || 'Your reminder is ready.';
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: REMINDER_SOUND,
      data: {
        type: 'nexus-reminder',
        reminderId: id,
        title,
        body,
        language: draft.language,
        voiceId: draft.voiceId ?? null,
      },
    },
    trigger,
  });
  const scheduledAt = k === 'delay'
    ? new Date(Date.now() + delay * 60000)
    : k === 'interval'
      ? new Date(Date.now() + Math.max(1, draft.repeatEveryMinutes || delay) * 60000)
      : target;

  return {
    id,
    title,
    body,
    delayMinutes: delay,
    scheduledAt: scheduledAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
    scheduledFor: scheduledAt.toISOString(),
    notificationId,
    language: draft.language,
    voiceId: draft.voiceId,
    scheduleKind: k,
    repeatEveryMinutes: k === 'interval' ? Math.max(1, draft.repeatEveryMinutes || delay) : undefined,
    weekdays: draft.weekdays,
    enabled: true,
    createdAt: now.toISOString(),
  };
}

export async function cancelReminder(r: ReminderItem) {
  await Notifications.cancelScheduledNotificationAsync(r.notificationId);
}

export async function rescheduleReminder(r: ReminderItem, draft: ReminderDraft) {
  await cancelReminder(r);
  return scheduleReminder({ ...draft, scheduleKind: draft.scheduleKind ?? r.scheduleKind });
}

export async function listScheduledReminderNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}
