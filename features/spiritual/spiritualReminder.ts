import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getCurrentGitaMessage } from './spiritualMessageLibrary';

export type SpiritualReminderPreferences = {
  enabled: boolean;
  intervalHours: number;
  startHour: number;
};

const KEY = '@nexus-plus/spiritual-reminders';
const DEFAULTS: SpiritualReminderPreferences = { enabled: true, intervalHours: 5, startHour: 8 };
const CHANNEL_ID = 'nexus-spiritual';

export async function readSpiritualReminderPreferences(): Promise<SpiritualReminderPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const value = JSON.parse(raw) as Partial<SpiritualReminderPreferences>;
    const interval = Number(value.intervalHours);
    return {
      enabled: value.enabled !== false,
      intervalHours: Number.isFinite(interval) ? Math.min(8, Math.max(4, interval)) : 5,
      startHour: Number.isFinite(value.startHour) ? Math.min(20, Math.max(0, Number(value.startHour))) : 8,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function writeSpiritualReminderPreferences(next: SpiritualReminderPreferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function cancelSpiritualReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of scheduled) {
    if ((item.content.data as { type?: string } | undefined)?.type === 'nexus-spiritual') {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }
}

export async function scheduleSpiritualReminders(): Promise<void> {
  await cancelSpiritualReminders();
  const prefs = await readSpiritualReminderPreferences();
  if (!prefs.enabled) return;
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Geeta Nexus Spiritual Messages',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180, 100, 180],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });

  const interval = Math.min(8, Math.max(4, prefs.intervalHours));
  const count = Math.floor((24 - prefs.startHour) / interval);
  for (let i = 0; i < count; i += 1) {
    const hour = prefs.startHour + i * interval;
    const message = await getCurrentGitaMessage(new Date(), i);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Geeta Nexus • आज का संदेश',
        body: message.text.length > 180 ? message.text.slice(0, 177) + '…' : message.text,
        data: { type: 'nexus-spiritual', chapter: message.chapter, verse: message.verse, source: message.source },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
        channelId: CHANNEL_ID,
      },
    });
  }
}
