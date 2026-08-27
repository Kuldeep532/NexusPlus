import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReminderItem } from './reminderTypes';

const KEY = '@nexus-plus/reminders/v2';

export async function loadReminders(): Promise<ReminderItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as ReminderItem[]; } catch { return []; }
}

export async function saveReminders(items: ReminderItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function upsertReminder(item: ReminderItem): Promise<ReminderItem[]> {
  const current = await loadReminders();
  const next = [item, ...current.filter((entry) => entry.id !== item.id)];
  await saveReminders(next);
  return next;
}

export async function removeReminder(id: string): Promise<ReminderItem[]> {
  const next = (await loadReminders()).filter((entry) => entry.id !== id);
  await saveReminders(next);
  return next;
}
