export type AssistantModel = {
  id: string;
  title: string;
  description: string;
  sizeMb: number;
  url: string;
  sha256?: string;
};

// Models are downloaded on demand; none of these weights are packaged in the APK.
// SmolLM2 360M is selected for the first local profile because its Q4_K_M GGUF is about 271 MB.
export const ASSISTANT_MODELS: AssistantModel[] = [
  {
    id: 'smollm2-360m-q4km',
    title: 'Nexus Small Chat',
    description: 'Small English-focused local chat model for low-resource devices.',
    sizeMb: 271,
    url: 'https://huggingface.co/QuantFactory/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct-Q4_K_M.gguf',
  },
];

export type AssistantVoice = {
  id: string;
  title: string;
  locale: string;
  quality: 'high';
  url: string;
  sizeMb: number;
};

export const ASSISTANT_VOICES: AssistantVoice[] = [
  {
    id: 'piper-en-us-lessac-high',
    title: 'Piper US English Female',
    locale: 'en-US',
    quality: 'high',
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx',
    sizeMb: 115,
  },
];

export const ASSISTANT_LIMITS = {
  maxApkSizeMb: 150,
  // Downloaded assets live outside the APK and can be deleted independently by the user.
  maxBundledModelMb: 0,
  maxBundledVoiceMb: 0,
};
