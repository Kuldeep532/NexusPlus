export type NexusVoiceLocale = 'hi-IN' | 'en-IN' | 'hinglish';

export interface NexusVoicePreferences {
  locale: NexusVoiceLocale;
  speechRate?: number;
  pitch?: number;
  preferAppVoice?: boolean;
}

export interface ProductivityVoiceBridge {
  startListening(options?: { locales?: NexusVoiceLocale[] }): Promise<void>;
  stopListening(): Promise<void>;
  speak(text: string, locale?: NexusVoiceLocale, preferences?: NexusVoicePreferences): Promise<void>;
  isAppVoiceAvailable?(): Promise<boolean>;
}

/**
 * Nexus AI Workflow voice contract.
 *
 * The workflow does not bundle a speech model. A native adapter may use an
 * already-installed Nexus voice/audio service first. If that service is not
 * available, it must fall back to the OS speech recognizer/TTS. This keeps the
 * APK small while preserving the app's language and voice preferences.
 */
export const DEFAULT_VOICE_LOCALES: NexusVoiceLocale[] = ['hi-IN', 'en-IN', 'hinglish'];
export const DEFAULT_VOICE_PREFERENCES: NexusVoicePreferences = {
  locale: 'hinglish',
  speechRate: 0.95,
  pitch: 1,
  preferAppVoice: true,
};

export function resolveVoiceLocale(preferred?: NexusVoiceLocale): NexusVoiceLocale {
  return preferred ?? DEFAULT_VOICE_PREFERENCES.locale;
}

export function voiceLocaleToSystemLocales(locale: NexusVoiceLocale): string[] {
  if (locale === 'hi-IN') return ['hi-IN', 'en-IN'];
  if (locale === 'en-IN') return ['en-IN', 'hi-IN'];
  return ['hi-IN', 'en-IN'];
}
