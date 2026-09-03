export type AssistantModel = {
  id: string;
  title: string;
  description: string;
  sizeMb: number;
  url: string;
  format: 'gguf' | 'onnx' | 'archive';
  kind: 'chat' | 'asr' | 'tts' | 'vad' | 'kws';
  sha256?: string;
  requiredFiles?: string[];
};

// Heavy assets are always downloaded on demand and never packaged in the APK.
export const ASSISTANT_MODELS: AssistantModel[] = [
  {
    id: 'smollm2-360m-q4km',
    title: 'Nexus Small Chat',
    description: 'Small English-focused local chat model for low-resource devices.',
    sizeMb: 271,
    url: 'https://huggingface.co/QuantFactory/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct.Q4_K_M.gguf',
    format: 'gguf',
    kind: 'chat',
  },
  {
    id: 'moonshine-tiny-en-quantized-2026-02-27',
    title: 'Moonshine Tiny English ASR',
    description: 'Local English speech recognition package for voice input.',
    sizeMb: 57,
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-moonshine-tiny-en-quantized-2026-02-27.tar.bz2',
    format: 'archive',
    kind: 'asr',
    requiredFiles: ['tokens.txt'],
  },
  {
    id: 'silero-vad',
    title: 'Silero VAD',
    description: 'Small local voice activity detector shared by speech pipelines.',
    sizeMb: 2,
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx',
    format: 'onnx',
    kind: 'vad',
    requiredFiles: ['silero_vad.onnx'],
  },
  {
    id: 'piper-en-us-lessac-medium-package',
    title: 'Piper US English Lessac Medium',
    description: 'Complete sherpa-onnx Piper voice package including model metadata, tokens and shared phonemization data.',
    sizeMb: 151,
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-lessac-medium.tar.bz2',
    format: 'archive',
    kind: 'tts',
    requiredFiles: ['en_US-lessac-medium.onnx', 'en_US-lessac-medium.onnx.json', 'tokens.txt'],
  },
];

export type AssistantVoice = {
  id: string;
  title: string;
  locale: string;
  quality: 'medium';
  url: string;
  sizeMb: number;
};

export const ASSISTANT_VOICES: AssistantVoice[] = [
  {
    id: 'piper-en-us-lessac-medium-package',
    title: 'Piper US English Female',
    locale: 'en-US',
    quality: 'medium',
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-lessac-medium.tar.bz2',
    sizeMb: 151,
  },
];

export const ASSISTANT_LIMITS = {
  maxApkSizeMb: 150,
  maxBundledModelMb: 0,
  maxBundledVoiceMb: 0,
};

export const ONNX_MODEL_POLICY = {
  runtime: 'onnx-runtime',
  storage: 'app-document-storage',
  offlineInference: true,
  deleteable: true,
} as const;
