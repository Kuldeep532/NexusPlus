import { UNIQUE_VOICE_CATALOG } from '@/features/voice-library/voiceCatalog';

export type AssistantVoiceRole = 'live-call' | 'reader' | 'assistant';

export type AssistantVoiceProfile = {
  id: string;
  role: AssistantVoiceRole;
  locale: string;
  quality: 'high' | 'medium';
  description: string;
};

export const ASSISTANT_VOICE_PROFILES: AssistantVoiceProfile[] = [
  { id: 'en-us-amy-medium', role: 'live-call', locale: 'en-US', quality: 'high', description: 'High-quality conversational voice for Nexus Assistant Live Voice Call.' },
  { id: 'en-in-priyanka-medium', role: 'reader', locale: 'en-IN', quality: 'high', description: 'Dedicated narration voice for Book Reader and long-form reading.' },
  { id: 'en-us-lessac-medium', role: 'assistant', locale: 'en-US', quality: 'high', description: 'General Assistant voice for short spoken responses.' },
  { id: 'hi-in-priyamvada-medium', role: 'reader', locale: 'hi-IN', quality: 'high', description: 'Dedicated Hindi narration voice.' },
];

export function getAssistantVoiceProfile(role: AssistantVoiceRole, locale = 'en-US'): AssistantVoiceProfile {
  const sameLocale = ASSISTANT_VOICE_PROFILES.find((profile) => profile.role === role && profile.locale.toLowerCase() === locale.toLowerCase());
  return sameLocale ?? ASSISTANT_VOICE_PROFILES.find((profile) => profile.role === role) ?? ASSISTANT_VOICE_PROFILES[0];
}

export function isVoiceAvailableInCanonicalCatalog(voiceId: string): boolean {
  return UNIQUE_VOICE_CATALOG.some((voice) => voice.id === voiceId);
}

export function getUniqueAssistantVoiceIds(): string[] {
  return [...new Set(ASSISTANT_VOICE_PROFILES.map((profile) => profile.id))];
}
