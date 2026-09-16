import * as Speech from 'expo-speech';

export type TtsVoice = {
  identifier: string;
  name: string;
  language: string;
  quality?: string | number;
  gender?: string;
  networkConnectionRequired?: boolean;
  notInstalled?: boolean;
};

export async function listAvailableTtsVoices(): Promise<TtsVoice[]> {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices.map((voice) => ({
    identifier: voice.identifier,
    name: voice.name || voice.identifier,
    language: voice.language,
    quality: voice.quality,
    gender: voice.gender,
    networkConnectionRequired: voice.networkConnectionRequired,
    notInstalled: voice.notInstalled,
  }));
}

export async function speakText(
  text: string,
  voice: TtsVoice,
  handlers?: Pick<Speech.SpeechOptions, 'onStart' | 'onDone' | 'onStopped' | 'onError' | 'onBoundary'>,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Enter text before generating speech.');
  await Speech.stop();
  Speech.speak(trimmed, { voice: voice.identifier, ...handlers });
}

export function stopTextToSpeech(): Promise<void> {
  return Speech.stop();
}
