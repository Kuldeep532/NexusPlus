import AsyncStorage from '@react-native-async-storage/async-storage';

export type AssistantVoiceMode = 'local' | 'device';
export type AssistantVoicePreference = {
  voiceId: string;
  mode: AssistantVoiceMode;
};

const KEY = 'nexus-plus.assistant.voice-preference.v1';
const DEFAULTS: AssistantVoicePreference = {
  voiceId: 'en-us-amy-medium',
  mode: 'local',
};

export async function getAssistantVoicePreference(): Promise<AssistantVoicePreference> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AssistantVoicePreference>;
    const mode = parsed.mode === 'device' ? 'device' : 'local';
    return {
      voiceId: typeof parsed.voiceId === 'string' && parsed.voiceId.trim() ? parsed.voiceId : DEFAULTS.voiceId,
      mode,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function setAssistantVoicePreference(preference: AssistantVoicePreference): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({
    voiceId: preference.voiceId,
    mode: preference.mode,
  }));
}
