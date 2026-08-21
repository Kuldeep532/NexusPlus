import { speakAnnouncement } from '@/features/time-announcer/announcementSpeaker';
import type { TimeAnnouncementSettings } from '@/features/time-announcer/timeAnnouncerTypes';

export async function speakFeatureText(text: string, language: 'en-IN' | 'hi-IN'): Promise<void> {
  const settings: TimeAnnouncementSettings = {
    enabled: true,
    intervalMinutes: 30,
    language,
    rate: 0.92,
    pitch: 1,
  };
  await speakAnnouncement(text, settings);
}
