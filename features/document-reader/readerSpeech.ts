import { generateWithPiper, type TtsSettings, type TtsVoiceOption } from '@/features/audio-editor/ttsEngine';
import { getInstalledVoices, type InstalledVoice } from '@/features/voice-library/voiceStore';

export async function resolveReaderVoice(preferredVoiceId?: string): Promise<TtsVoiceOption | null> {
  const installed = await getInstalledVoices();
  const preferred = preferredVoiceId ? installed.find((voice) => voice.id === preferredVoiceId) : undefined;
  const readerVoice = installed.find((voice) => voice.roles?.includes('reader'));
  const voice = preferred ?? readerVoice ?? installed[0];
  if (!voice) return null;

  const isClone = voice.canonicalGroupId?.startsWith('clone:');
  return isClone
    ? { provider: 'clone', id: voice.id, name: voice.name, language: voice.language, installed: true, modelPath: voice.modelPath, configPath: voice.configPath }
    : { provider: 'piper', id: voice.id, name: voice.name, language: voice.language, gender: voice.gender, quality: voice.quality, installed: true, modelPath: voice.modelPath, configPath: voice.configPath };
}

export async function synthesizeReaderText(text: string, preferredVoiceId?: string, settings?: TtsSettings) {
  const voice = await resolveReaderVoice(preferredVoiceId);
  if (!voice) throw new Error('No downloaded Reader voice is available. Download a Piper voice or configure a local clone voice.');
  return generateWithPiper(text, voice, settings);
}
