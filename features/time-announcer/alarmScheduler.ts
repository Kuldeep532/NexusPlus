import * as Notifications from 'expo-notifications';
import type { Alarm } from './timeAnnouncerTypes';

export const ALARM_CHANNEL_ID = 'nexus-alarm';
export const ALARM_NOTIFICATION_SOUND = 'notification';

export async function configureAlarmNotifications(): Promise<void> {
  await Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: 'Alarms',
    importance: Notifications.AndroidImportance.MAX,
    sound: ALARM_NOTIFICATION_SOUND,
    vibrationPattern: [0, 250, 200, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function requestAlarmPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function scheduleAlarm(alarm: Alarm): Promise<string> {
  const permissionGranted = await requestAlarmPermission();
  if (!permissionGranted) throw new Error('Notification permission is required for alarms.');

  const weekdays = alarm.weekdays.length ? [...new Set(alarm.weekdays)] : [];
  const ids: string[] = [];
  const content = {
    title: alarm.label || 'Alarm',
    body: 'Alarm is ringing.',
    sound: ALARM_NOTIFICATION_SOUND,
    data: { type: 'nexus-alarm', alarmId: alarm.id },
  };

  if (weekdays.length === 0) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: alarm.hour,
        minute: alarm.minute,
        channelId: ALARM_CHANNEL_ID,
      },
    });
    ids.push(id);
  } else {
    for (const weekday of weekdays) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { ...content, data: { ...content.data, weekday } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: alarm.hour,
          minute: alarm.minute,
          channelId: ALARM_CHANNEL_ID,
        },
      });
      ids.push(id);
    }
  }

  return ids.join(',');
}

export async function cancelAlarm(notificationIds?: string): Promise<void> {
  if (!notificationIds) return;
  for (const id of notificationIds.split(',').filter(Boolean)) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}
