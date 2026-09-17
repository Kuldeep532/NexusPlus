import { generateWithPiper, listTtsVoices, type TtsGenerateResult, type TtsSettings, type TtsVoiceOption } from '@/features/audio-editor/ttsEngine';

export type VisionSpeechOptions = TtsSettings & {
  voiceId?: string;
};

export async function listVisionSpeechVoices(): Promise<TtsVoiceOption[]> {
  return listTtsVoices();
}

export async function speakVisionText(text: string, options: VisionSpeechOptions = {}): Promise<TtsGenerateResult> {
  const voices = await listTtsVoices();
  const preferred = options.voiceId ? voices.find((voice) => voice.id === options.voiceId) : undefined;
  const selected = preferred ?? voices.find((voice) => voice.provider === 'clone') ?? voices.find((voice) => voice.provider === 'piper');
  if (!selected || selected.provider === 'system') {
    throw new Error('No installed Piper or clone voice is available. Download a voice or configure a local clone voice first.');
  }
  return generateWithPiper(text, selected, options);
}
