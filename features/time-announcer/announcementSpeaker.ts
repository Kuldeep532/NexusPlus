import * as Speech from 'expo-speech';
import { speakWithPiper } from './piperTts';
import type { TimeAnnouncementSettings } from './timeAnnouncerTypes';

export async function speakAnnouncement(text: string, settings: TimeAnnouncementSettings): Promise<void> {
  Speech.stop();

  try {
    const language = settings.language.toLowerCase().startsWith('hi') ? 'hi' : 'en';
    const spoken = await speakWithPiper(text, language);
    if (spoken) return;
  } catch {
    // Fall back to system TTS if Piper's native runtime is unavailable.
  }

  const voices = await Speech.getAvailableVoicesAsync();
  const voice = settings.voiceIdentifier ?? voices
    .filter((item) => item.language?.toLowerCase().startsWith(settings.language.toLowerCase().slice(0, 2)))
    .sort((a, b) => Number(b.quality === 'Enhanced') - Number(a.quality === 'Enhanced'))[0]?.identifier;

  Speech.speak(text, {
    language: settings.language,
    voice,
    rate: settings.rate,
    pitch: settings.pitch,
    volume: 1,
  });
}
