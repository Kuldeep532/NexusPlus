export interface ProductivityVoiceBridge {
  startListening(options?: { locales?: string[] }): Promise<void>;
  stopListening(): Promise<void>;
  speak(text: string, locale?: string): Promise<void>;
}

/**
 * Native adapter contract. Android should delegate to the device's installed
 * speech recognizer and Text-to-Speech service instead of shipping voice models.
 */
export const DEFAULT_VOICE_LOCALES = ['hi-IN', 'en-IN'];
