import * as Notifications from 'expo-notifications';
import type { ReminderDraft, ReminderItem } from './reminderTypes';

export const REMINDER_CHANNEL_ID = 'nexus-reminders';
export const REMINDER_SOUND = 'notification';

export async function configureReminderNotifications(): Promise<void> {
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Nexus Reminders',
    importance: Notifications.AndroidImportance.MAX,
    sound: REMINDER_SOUND,
    vibrationPattern: [0, 300, 150, 300],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function scheduleReminder(draft: ReminderDraft): Promise<ReminderItem> {
  const granted = await requestReminderPermission();
  if (!granted) throw new Error('Notification permission is required for reminders.');

  const delayMinutes = Math.max(1, Number.parseInt(draft.delayMinutes, 10) || 5);
  const id = `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const scheduledAt = new Date(Date.now() + delayMinutes * 60_000);
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: draft.title.trim() || 'Nexus Reminder',
      body: draft.body.trim() || 'Your reminder is ready.',
      sound: REMINDER_SOUND,
      data: {
        type: 'nexus-reminder',
        reminderId: id,
        title: draft.title.trim() || 'Nexus Reminder',
        body: draft.body.trim(),
        language: draft.language,
        voiceId: draft.voiceId ?? null,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delayMinutes * 60,
      repeats: false,
    },
  });

  return {
    id,
    title: draft.title.trim() || 'Nexus Reminder',
    body: draft.body.trim(),
    delayMinutes,
    scheduledAt: scheduledAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
    notificationId,
    language: draft.language,
    voiceId: draft.voiceId,
  };
}

export async function cancelReminder(reminder: ReminderItem): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
}
