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

/**
 * One primary downloadable local chat model is exposed to the user.
 * Speech recognition remains a separate small model because ASR and text
 * generation are different inference tasks.
 */
export const NEXUS_CORE_MODEL_ID = 'smollm2-360m-q4km';
export const NEXUS_ASR_MODEL_ID = 'moonshine-tiny-en-quantized-2026-02-27';

export const ASSISTANT_MODELS: AssistantModel[] = [
  {
    id: NEXUS_CORE_MODEL_ID,
    title: 'Nexus Core AI',
    description: 'Primary local chat model for Assistant, books, files, summaries, explanations and general AI tasks.',
    sizeMb: 271,
    url: 'https://huggingface.co/QuantFactory/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct.Q4_K_M.gguf',
    format: 'gguf',
    kind: 'chat',
  },
  {
    id: NEXUS_ASR_MODEL_ID,
    title: 'Nexus Speech Transcriber',
    description: 'Local English speech transcription model used to turn voice and extracted video audio into text.',
    sizeMb: 57,
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-moonshine-tiny-en-quantized-2026-02-27.tar.bz2',
    format: 'archive',
    kind: 'asr',
    requiredFiles: ['tokens.txt'],
  },
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
