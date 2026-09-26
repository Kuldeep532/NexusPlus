import { Linking, NativeModules, Platform } from 'react-native';

type NexusAlarmBridge = {
  canScheduleExactAlarms?: () => Promise<boolean>;
  schedule?: (id: string, hour: number, minute: number) => Promise<{ scheduled?: boolean; reason?: string }>;
};

const alarm = NativeModules.NexusAlarm as NexusAlarmBridge | undefined;

export type CalendarDraft = {
  title: string;
  description?: string;
  startAt?: Date;
  endAt?: Date;
};

export async function setAssistantAlarm(hour: number, minute: number): Promise<string> {
  if (Platform.OS !== 'android' || !alarm?.schedule) return 'Alarms are available only on Android.';
  const allowed = await alarm.canScheduleExactAlarms?.();
  if (allowed === false) return 'Please allow Alarms & reminders permission for Nexus Plus, then try again.';
  const id = 'assistant-alarm-' + Date.now();
  const result = await alarm.schedule(id, hour, minute);
  if (result?.scheduled) {
    const suffix = minute.toString().padStart(2, '0');
    return `Alarm scheduled for ${hour.toString().padStart(2, '0')}:${suffix}.`;
  }
  return result?.reason === 'exact_alarm_permission'
    ? 'Please allow Alarms & reminders permission for Nexus Plus, then try again.'
    : 'The alarm could not be scheduled.';
}

export async function openCalendarEventDraft(draft: CalendarDraft): Promise<string> {
  if (Platform.OS !== 'android') return 'Calendar actions are available only on Android.';
  const start = draft.startAt ?? new Date(Date.now() + 60 * 60 * 1000);
  const end = draft.endAt ?? new Date(start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams();
  params.set('title', draft.title.trim() || 'Nexus Assistant event');
  if (draft.description?.trim()) params.set('description', draft.description.trim());
  params.set('beginTime', String(start.getTime()));
  params.set('endTime', String(end.getTime()));
  const uri = 'content://com.android.calendar/events?' + params.toString();
  try {
    await Linking.openURL(uri);
    return 'Calendar event details prepared. Review and save it in your calendar.';
  } catch {
    return 'The calendar app could not be opened.';
  }
}
