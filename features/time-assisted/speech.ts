import { speakAnnouncement } from '@/features/time-announcer/announcementSpeaker';
import { playTimeAnnouncementBeep } from './beepPlayer';
import type { AnnouncementSettings } from './timeAssistedTypes';

function formatTime(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function buildTimeAnnouncement(date: Date, settings: AnnouncementSettings): string {
  const time = formatTime(date, settings.language);
  const includeDate = settings.includeDate ? new Intl.DateTimeFormat(settings.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(date) : '';
  const includeDay = settings.includeDay ? new Intl.DateTimeFormat(settings.language, { weekday: 'long' }).format(date) : '';
  if (settings.language.toLowerCase().startsWith('hi')) {
    const parts = [`समय है ${time}।`];
    if (includeDay) parts.push(`आज ${includeDay} है।`);
    if (includeDate) parts.push(`तारीख ${includeDate} है।`);
    return parts.join(' ');
  }
  const parts = [`The time is ${time}.`];
  if (includeDay) parts.push(`Today is ${includeDay}.`);
  if (includeDate) parts.push(`The date is ${includeDate}.`);
  return parts.join(' ');
}

export async function speakTimeAssisted(settings: AnnouncementSettings, date = new Date()): Promise<void> {
  await playTimeAnnouncementBeep();
  await speakAnnouncement(buildTimeAnnouncement(date, settings), settings as never);
}
