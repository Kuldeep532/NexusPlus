import * as Speech from 'expo-speech';
import { createAudioPlayer } from 'expo-audio';
import { getInstalledVoices, type InstalledVoice } from '@/features/voice-library/voiceStore';

let player: ReturnType<typeof createAudioPlayer> | null = null;

export type ReminderVoiceResolution = {
  mode: 'piper' | 'system';
  voice?: InstalledVoice;
};

type NexusPiperBridge = {
  synthesize?: (args: { text: string; modelPath: string; configPath: string }) => Promise<string>;
};

function getPiperBridge(): NexusPiperBridge | undefined {
  return (globalThis as typeof globalThis & { NexusPiper?: NexusPiperBridge }).NexusPiper;
}

export async function resolveReminderVoice(language: string, voiceId?: string): Promise<ReminderVoiceResolution> {
  const installed = await getInstalledVoices();
  const exact = voiceId ? installed.find((voice) => voice.id === voiceId) : undefined;
  const languageMatch = installed.find((voice) => voice.language.toLowerCase().startsWith(language.slice(0, 2).toLowerCase()));
  return { mode: getPiperBridge()?.synthesize && (exact || languageMatch) ? 'piper' : 'system', voice: exact || languageMatch };
}

export async function speakReminder(text: string, language: string, voiceId?: string): Promise<ReminderVoiceResolution> {
  Speech.stop();
  const resolution = await resolveReminderVoice(language, voiceId);
  const bridge = getPiperBridge();

  if (resolution.mode === 'piper' && bridge?.synthesize && resolution.voice) {
    try {
      const wavPath = await bridge.synthesize({
        text,
        modelPath: resolution.voice.modelPath,
        configPath: resolution.voice.configPath,
      });
      player?.remove();
      player = createAudioPlayer(wavPath);
      player.volume = 1;
      player.play();
      return resolution;
    } catch {
      // The downloaded model remains available; use system TTS for reliability.
    }
  }

  const voices = await Speech.getAvailableVoicesAsync();
  const preferred = voices
    .filter((voice) => voice.language?.toLowerCase().startsWith(language.slice(0, 2).toLowerCase()))
    .sort((a, b) => Number(b.quality === 'Enhanced') - Number(a.quality === 'Enhanced'))[0];

  Speech.speak(text, {
    language,
    voice: preferred?.identifier,
    rate: 0.92,
    pitch: 1,
    volume: 1,
  });
  return { mode: 'system' };
}
