export type VoiceInputState = 'idle' | 'listening' | 'processing';

export type LiveBoardState = { isOpen: boolean; voiceInput: VoiceInputState; transcript: string; assistantText: string };
export type VoiceTranscriptHandler = (text: string) => void;

export type Stage6VoiceBridge = {
  isAvailable(): Promise<boolean>;
  startListening(onTranscript?: VoiceTranscriptHandler): Promise<void>;
  stopListening(): Promise<void>;
  stopOutput(): Promise<void>;
  speak(text: string, options?: { modelPath?: string; configPath?: string }): Promise<void>;
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
