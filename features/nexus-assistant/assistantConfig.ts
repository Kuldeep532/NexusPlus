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

export const ASSISTANT_MODELS: AssistantModel[] = [
  { id: 'smollm2-360m-q4km', title: 'Nexus Small Chat', description: 'Small English-focused local chat model.', sizeMb: 271, url: 'https://huggingface.co/QuantFactory/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct.Q4_K_M.gguf', format: 'gguf', kind: 'chat' },
  { id: 'moonshine-tiny-en-quantized-2026-02-27', title: 'Moonshine Tiny English ASR', description: 'Local English speech recognition package for Voice Input and Live Mode.', sizeMb: 57, url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-moonshine-tiny-en-quantized-2026-02-27.tar.bz2', format: 'archive', kind: 'asr', requiredFiles: ['tokens.txt'] },
  { id: 'silero-vad', title: 'Silero VAD', description: 'Local voice activity detection asset.', sizeMb: 2, url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx', format: 'onnx', kind: 'vad' },
];

export type AssistantVoice = {
  id: string;
  title: string;
  locale: string;
  quality: 'high' | 'medium';
  url: string;
  sizeMb: number;
};

/** Assistant uses the same canonical voice IDs as Voice Library; no duplicate assets are introduced here. */
export const ASSISTANT_VOICES: AssistantVoice[] = [
  { id: 'en-us-amy-medium', title: 'Amy Medium · Live Voice Call', locale: 'en-US', quality: 'high', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx?download=true', sizeMb: 61 },
  { id: 'en-in-priyanka-medium', title: 'Priyanka Medium · Reader', locale: 'en-IN', quality: 'high', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_IN/priyanka/medium/en_IN-priyanka-medium.onnx?download=true', sizeMb: 61 },
  { id: 'en-us-lessac-medium', title: 'Lessac Medium · Assistant', locale: 'en-US', quality: 'high', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx?download=true', sizeMb: 61 },
  { id: 'hi-in-priyamvada-medium', title: 'Priyamvada Medium · Hindi Reader', locale: 'hi-IN', quality: 'high', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx?download=true', sizeMb: 61 },
];

export const ASSISTANT_LIMITS = { maxApkSizeMb: 150, maxBundledModelMb: 0, maxBundledVoiceMb: 0 };
export const ONNX_MODEL_POLICY = { runtime: 'onnx-runtime', storage: 'app-document-storage', offlineInference: true, deleteable: true } as const;
