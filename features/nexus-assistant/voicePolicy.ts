export type AssistantVoiceRole = 'live-call' | 'reader' | 'assistant';

export type AssistantVoiceProfile = {
  id: string;
  role: AssistantVoiceRole;
  locale: string;
  quality: 'high' | 'medium';
  description: string;
};

/**
 * Voice roles are explicit so Live/Voice Call never silently reuses a Reader
 * voice. IDs intentionally refer to the same canonical voice-library entries.
 */
export const ASSISTANT_VOICE_PROFILES: AssistantVoiceProfile[] = [
  {
    id: 'en-us-amy-medium',
    role: 'live-call',
    locale: 'en-US',
    quality: 'high',
    description: 'High-quality conversational voice for Nexus Assistant Live Voice Call.',
  },
  {
    id: 'en-in-priyanka-medium',
    role: 'reader',
    locale: 'en-IN',
    quality: 'high',
    description: 'Dedicated narration voice for Book Reader and long-form reading.',
  },
  {
    id: 'en-us-lessac-medium',
    role: 'assistant',
    locale: 'en-US',
    quality: 'high',
    description: 'General Assistant fallback voice for short spoken responses.',
  },
];

export function getAssistantVoiceProfile(role: AssistantVoiceRole, locale = 'en-US'): AssistantVoiceProfile {
  const sameLocale = ASSISTANT_VOICE_PROFILES.find((profile) => profile.role === role && profile.locale.toLowerCase() === locale.toLowerCase());
  if (sameLocale) return sameLocale;
  const sameRole = ASSISTANT_VOICE_PROFILES.find((profile) => profile.role === role);
  return sameRole ?? ASSISTANT_VOICE_PROFILES[0];
}

export function getUniqueAssistantVoiceIds(): string[] {
  return [...new Set(ASSISTANT_VOICE_PROFILES.map((profile) => profile.id))];
}
