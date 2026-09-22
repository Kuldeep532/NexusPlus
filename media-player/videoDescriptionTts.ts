import * as Speech from 'expo-speech';
import { listTtsVoices, generateWithPiper, playGeneratedAudio, type TtsVoiceOption } from '@/features/audio-editor/ttsEngine';

export type VideoDescriptionTtsLanguage = 'hi' | 'en';

type SpeakResult = { provider: 'piper' | 'system'; stop: () => void | Promise<void> };

function languageTag(language: VideoDescriptionTtsLanguage): string { return language === 'hi' ? 'hi-IN' : 'en-IN'; }

function choosePiper(voices: TtsVoiceOption[], language: VideoDescriptionTtsLanguage): Extract<TtsVoiceOption, { provider: 'piper' }> | null {
  const target = languageTag(language).toLowerCase();
  const found = voices.find((voice) => voice.provider === 'piper' && voice.installed && voice.language.toLowerCase() === target);
  return (found as Extract<TtsVoiceOption, { provider: 'piper' }> | undefined) ?? null;
}

export async function speakVideoDescription(text: string, language: VideoDescriptionTtsLanguage): Promise<SpeakResult> {
  const normalized = text.trim();
  if (!normalized) throw new Error('VIDEO_DESCRIPTION_EMPTY');
  Speech.stop();

  try {
    const voices = await listTtsVoices();
    const piper = choosePiper(voices, language);
    if (piper?.modelPath && piper.configPath) {
      const result = await generateWithPiper(normalized, piper, { speed: 1, pitch: 1, autoTune: false });
      const stop = await playGeneratedAudio(result.outputUri);
      return { provider: 'piper', stop };
    }
  } catch {
    // Fall through to the Android/system voice.
  }

  const fallback = languageTag(language);
  await Speech.speak(normalized, { language: fallback, rate: 1.0, pitch: 1.0 });
  return { provider: 'system', stop: () => Speech.stop() };
}

export function detectVideoDescriptionLanguage(text: string): VideoDescriptionTtsLanguage {
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  return hasDevanagari ? 'hi' : 'en';
}
