import * as Speech from 'expo-speech';
import { File } from 'expo-file-system';
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

function safeStopPlayer(): void {
  try { player?.pause(); } catch { /* optional cleanup */ }
  try { player?.remove(); } catch { /* optional cleanup */ }
  player = null;
}

function safeAudioPath(path: unknown): path is string {
  if (typeof path !== 'string' || !path.trim()) return false;
  try {
    const file = new File(path);
    return file.exists && file.size > 0;
  } catch {
    return false;
  }
}

export async function resolveReminderVoice(language: string, voiceId?: string): Promise<ReminderVoiceResolution> {
  try {
    const installed = await getInstalledVoices();
    const exact = voiceId ? installed.find((voice) => voice.id === voiceId) : undefined;
    const languageMatch = installed.find((voice) => voice.language.toLowerCase().startsWith(language.slice(0, 2).toLowerCase()));
    return { mode: getPiperBridge()?.synthesize && (exact || languageMatch) ? 'piper' : 'system', voice: exact || languageMatch };
  } catch {
    return { mode: 'system' };
  }
}

export async function speakReminder(text: string, language: string, voiceId?: string): Promise<ReminderVoiceResolution> {
  const normalizedText = text.trim();
  if (!normalizedText) return { mode: 'system' };

  try { Speech.stop(); } catch { /* system TTS may already be idle */ }
  const resolution = await resolveReminderVoice(language, voiceId);
  const bridge = getPiperBridge();

  if (resolution.mode === 'piper' && bridge?.synthesize && resolution.voice) {
    try {
      const wavPath = await bridge.synthesize({
        text: normalizedText,
        modelPath: resolution.voice.modelPath,
        configPath: resolution.voice.configPath,
      });
      if (!safeAudioPath(wavPath)) throw new Error('INVALID_PIPER_AUDIO');
      safeStopPlayer();
      const nextPlayer = createAudioPlayer(wavPath);
      nextPlayer.volume = 1;
      player = nextPlayer;
      nextPlayer.play();
      return resolution;
    } catch {
      safeStopPlayer();
      // The downloaded model remains available; use system TTS for reliability.
    }
  }

  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const preferred = voices
      .filter((voice) => voice.language?.toLowerCase().startsWith(language.slice(0, 2).toLowerCase()))
      .sort((a, b) => Number(b.quality === 'Enhanced') - Number(a.quality === 'Enhanced'))[0];

    Speech.speak(normalizedText, {
      language,
      voice: preferred?.identifier,
      rate: 0.92,
      pitch: 1,
      volume: 1,
    });
  } catch {
    // Reminder delivery should not fail because optional audio output is unavailable.
  }
  return { mode: 'system' };
}
