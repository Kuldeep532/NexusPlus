import * as Speech from 'expo-speech';
import type { TimeAnnouncementSettings } from './timeAnnouncerTypes';

export function formatCurrentTime(date = new Date(), locale = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatClockTime(date: Date, timeZone: string, locale = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function getTimeAnnouncementPhrase(date = new Date()): string {
  const value = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
  return `The time is ${value}.`;
}

export async function chooseBestVoice(language = 'en-IN'): Promise<string | undefined> {
  const voices = await Speech.getAvailableVoicesAsync();
  const candidates = voices
    .filter((voice) => voice.language?.toLowerCase().startsWith(language.toLowerCase().slice(0, 2)))
    .sort((a, b) => Number(b.quality === 'Enhanced') - Number(a.quality === 'Enhanced'));
  return candidates[0]?.identifier;
}

export async function speakTime(settings: TimeAnnouncementSettings): Promise<void> {
  const voice = settings.voiceIdentifier ?? await chooseBestVoice(settings.language);
  Speech.stop();
  Speech.speak(getTimeAnnouncementPhrase(), {
    language: settings.language,
    voice,
    rate: settings.rate,
    pitch: settings.pitch,
    volume: 1,
  });
}

export function formatStopwatch(milliseconds: number): string {
  const totalCentiseconds = Math.floor(milliseconds / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}
