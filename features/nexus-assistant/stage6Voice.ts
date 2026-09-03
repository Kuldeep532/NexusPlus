export type VoiceInputState = 'idle' | 'listening' | 'processing';

export type LiveBoardState = {
  isOpen: boolean;
  voiceInput: VoiceInputState;
  transcript: string;
  assistantText: string;
};

/**
 * Stage 6 UI/native boundary. The actual Android microphone/STT/TTS implementation
 * is intentionally isolated behind this contract so the chat screen stays testable.
 */
export type Stage6VoiceBridge = {
  isAvailable(): Promise<boolean>;
  startListening(onTranscript: (text: string) => void): Promise<void>;
  stopListening(): Promise<void>;
  stopOutput(): Promise<void>;
  speak(text: string): Promise<void>;
};

export function createUnavailableVoiceBridge(): Stage6VoiceBridge {
  return {
    async isAvailable() { return false; },
    async startListening() { throw new Error('VOICE_INPUT_NATIVE_BRIDGE_UNAVAILABLE'); },
    async stopListening() {},
    async stopOutput() {},
    async speak() { throw new Error('VOICE_OUTPUT_NATIVE_BRIDGE_UNAVAILABLE'); },
  };
}
