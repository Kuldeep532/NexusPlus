import { UNIQUE_VOICE_CATALOG } from '../voice-library/voiceCatalog';

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
};

/** Assistant voice metadata is derived from the canonical Voice Library registry. */
export const ASSISTANT_VOICES: AssistantVoice[] = UNIQUE_VOICE_CATALOG
  .filter((voice) => voice.roles?.includes('live-call') || voice.roles?.includes('assistant') || voice.roles?.includes('reader'))
  .map((voice) => ({
    id: voice.id,
    title: `${voice.name} · ${voice.roles?.includes('live-call') ? 'Live Voice Call' : voice.roles?.includes('reader') ? 'Reader' : 'Assistant'}`,
    locale: voice.language,
    quality: voice.quality,
  }));

export const ASSISTANT_LIMITS = { maxApkSizeMb: 150, maxBundledModelMb: 0, maxBundledVoiceMb: 0 };
export const ONNX_MODEL_POLICY = { runtime: 'onnx-runtime', storage: 'app-document-storage', offlineInference: true, deleteable: true } as const;
