export type AssistantModel = {
  id: string;
  title: string;
  description: string;
  sizeMb: number;
  url: string;
  format: 'gguf' | 'onnx';
  kind: 'chat' | 'asr' | 'tts' | 'vad' | 'kws';
  sha256?: string;
};

// Heavy model assets are always downloaded on demand and never packaged in the APK.
export const ASSISTANT_MODELS: AssistantModel[] = [
  {
    id: 'smollm2-360m-q4km',
    title: 'Nexus Small Chat',
    description: 'Small English-focused local chat model for low-resource devices.',
    sizeMb: 271,
    url: 'https://huggingface.co/QuantFactory/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct-Q4_K_M.gguf',
    format: 'gguf',
    kind: 'chat',
  },
  {
    id: 'piper-en-us-lessac-high',
    title: 'Piper US English Female',
    description: 'High-quality Piper-compatible English TTS voice for local speech output.',
    sizeMb: 115,
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx',
    format: 'onnx',
    kind: 'tts',
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
  maxApkSizeMb: 195,
  maxBundledModelMb: 0,
  maxBundledVoiceMb: 0,
};

export const ONNX_MODEL_POLICY = {
  runtime: 'onnx-runtime',
  storage: 'app-document-storage',
  offlineInference: true,
  deleteable: true,
} as const;
