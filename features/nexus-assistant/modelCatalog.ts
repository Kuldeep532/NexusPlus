export type AssistantAssetKind = 'chat' | 'asr' | 'tts' | 'vad';

export type AssistantAsset = {
  id: string;
  title: string;
  description: string;
  kind: AssistantAssetKind;
  format: 'gguf' | 'onnx' | 'archive';
  sizeMb: number;
  downloadUrl: string;
  archive?: 'tar.bz2';
  requiredFiles?: string[];
  lazy: true;
  bundled: false;
};

/**
 * Stage 8 catalog: source URLs are pinned to public upstream release/model files.
 * Assets are not bundled into the APK and are fetched only when a feature requests them.
 */
export const ASSISTANT_ASSET_CATALOG: AssistantAsset[] = [
  {
    id: 'chat-smollm2-360m-q4km',
    title: 'Nexus Small Chat',
    description: 'SmolLM2 360M Instruct Q4_K_M GGUF for optional on-device text generation.',
    kind: 'chat',
    format: 'gguf',
    sizeMb: 271,
    downloadUrl: 'https://huggingface.co/QuantFactory/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct.Q4_K_M.gguf',
    lazy: true,
    bundled: false,
  },
  {
    id: 'asr-moonshine-tiny-en-int8-v2',
    title: 'Moonshine Tiny English ASR',
    description: 'Sherpa-ONNX quantized English speech model for local voice input.',
    kind: 'asr',
    format: 'archive',
    sizeMb: 57,
    downloadUrl: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-moonshine-tiny-en-quantized-2026-02-27.tar.bz2',
    archive: 'tar.bz2',
    requiredFiles: ['tokens.txt'],
    lazy: true,
    bundled: false,
  },
  {
    id: 'vad-silero',
    title: 'Silero VAD',
    description: 'Small voice-activity detector shared by local speech pipelines.',
    kind: 'vad',
    format: 'onnx',
    sizeMb: 2,
    downloadUrl: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx',
    requiredFiles: ['silero_vad.onnx'],
    lazy: true,
    bundled: false,
  },
  {
    id: 'tts-piper-en-us-lessac-medium',
    title: 'Piper US English Lessac Medium',
    description: 'Sherpa-ONNX Piper-compatible English voice package with model metadata and shared espeak-ng data.',
    kind: 'tts',
    format: 'archive',
    sizeMb: 151,
    downloadUrl: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-lessac-medium.tar.bz2',
    archive: 'tar.bz2',
    requiredFiles: ['en_US-lessac-medium.onnx', 'en_US-lessac-medium.onnx.json', 'tokens.txt'],
    lazy: true,
    bundled: false,
  },
];

export function getAssistantAsset(id: string): AssistantAsset | null {
  return ASSISTANT_ASSET_CATALOG.find((asset) => asset.id === id) ?? null;
}

export function getAssistantAssetsFor(kind: AssistantAssetKind): AssistantAsset[] {
  return ASSISTANT_ASSET_CATALOG.filter((asset) => asset.kind === kind);
}
