import * as Speech from 'expo-speech';
import type { FeatureTtsLanguage } from './languagePreferences';

export async function speakFeatureText(text: string, language: FeatureTtsLanguage): Promise<void> {
  Speech.stop();
  return new Promise((resolve) => {
    Speech.speak(text, {
      language,
      rate: 0.92,
      pitch: 1,
      volume: 1,
      onDone: resolve,
      onStopped: resolve,
      onError: resolve,
    });
  });
}
