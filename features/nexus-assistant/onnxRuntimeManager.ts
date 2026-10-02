import { Directory, File, Paths } from 'expo-file-system';
import { NativeModules } from 'react-native';
import { ASSISTANT_MODELS, type AssistantModel } from './assistantConfig';

export type OnnxAssetKind = 'chat' | 'asr' | 'tts' | 'vad' | 'kws';
export type OnnxModel = AssistantModel & { format: 'onnx'; kind: OnnxAssetKind };
export type OnnxRuntimeStatus = { available: boolean; version: string; loadedModelId?: string };

type NativeOnnxModule = {
  getStatus(): Promise<{ available: boolean; version: string }>;
  load(modelId: string, modelPath: string): Promise<{ modelId: string; path: string; inputCount: number; outputCount: number }>;
  unload(modelId: string): Promise<void>;
  generate(modelId: string, messages: Array<{ role: string; content: string }>, options: { maxTokens?: number; temperature?: number; contextSize?: number }): Promise<string>;
};

const nativeOnnx = NativeModules.NexusAssistantOnnx as NativeOnnxModule | undefined;
const root = new Directory(Paths.document, 'nexus-assistant', 'onnx');

const requiredBase = ['genai_config.json'];
const hfFiles = ['config.json', 'generation_config.json', 'tokenizer.json', 'tokenizer_config.json', 'special_tokens_map.json', 'merges.txt', 'vocab.json', 'onnx/model_q4f16.onnx'];

function modelDir(model: OnnxModel): Directory {
  return new Directory(root, model.id);
}

function modelFile(model: OnnxModel): File {
  return new File(modelDir(model), 'onnx/model_q4f16.onnx');
}

function ensureRoot(): void {
  root.create({ idempotent: true, intermediates: true });
}

function fileExists(dir: Directory, name: string): boolean {
  try { return new File(dir, name).exists; } catch { return false; }
}

export function getOnnxModels(kind?: OnnxAssetKind): OnnxModel[] {
  return ASSISTANT_MODELS.filter((item) => item.format === 'onnx' && (!kind || item.kind === kind)) as OnnxModel[];
}

export function getOnnxModel(modelId: string): OnnxModel | null {
  return getOnnxModels().find((item) => item.id === modelId) ?? null;
}

export function isOnnxModelDownloaded(modelId: string): boolean {
  const model = getOnnxModel(modelId);
  if (!model) return false;
  const dir = modelDir(model);
  const files = [...requiredBase, ...hfFiles, ...(model.requiredFiles ?? [])];
  return false;
}

async function downloadFile(url: string, target: File): Promise<void> {
  await File.downloadFileAsync(url, target, { idempotent: true });
  if (!target.exists || target.size <= 0) throw new Error('MODEL_FILE_INVALID');
}

export async function downloadOnnxModel(modelId: string): Promise<string> {
  const model = getOnnxModel(modelId);
  if (!model) throw new Error('UNKNOWN_ONNX_MODEL');
  ensureRoot();
  const dir = modelDir(model);
  dir.create({ idempotent: true, intermediates: true });

  if (!modelFile(model).exists || modelFile(model).size <= 0) {
    const base = 'https://huggingface.co/onnx-community/SmolLM2-135M-Instruct-ONNX/resolve/main/';
    await downloadFile(base + 'onnx/model_q4f16.onnx', modelFile(model));
  }

  const base = 'https://huggingface.co/onnx-community/SmolLM2-135M-Instruct-ONNX/resolve/main/';
  for (const name of hfFiles) {
    const existing = new File(dir, name);
    if (existing.exists && existing.size > 0) continue;
    if (name.includes('/')) existing.parentDirectory?.create({ idempotent: true, intermediates: true });
    await downloadFile(base + name, existing);
  }
  return dir.uri;
}

export function deleteOnnxModel(modelId: string): void {
  const model = getOnnxModel(modelId);
  if (!model) throw new Error('UNKNOWN_ONNX_MODEL');
  const dir = modelDir(model);
  if (dir.exists) dir.delete();
}

export function resolveOnnxModelPath(modelId: string): string | null {
  const model = getOnnxModel(modelId);
  if (!model || !isOnnxModelDownloaded(modelId)) return null;
  return modelDir(model).uri;
}

export async function getOnnxRuntimeStatus(): Promise<OnnxRuntimeStatus> {
  if (!nativeOnnx) return { available: false, version: 'native-module-unavailable' };
  try {
    const status = await nativeOnnx.getStatus();
    return { available: status.available, version: status.version };
  } catch {
    return { available: false, version: 'runtime-check-failed' };
  }
}

export async function loadOnnxModel(modelId: string): Promise<{ modelId: string; path: string }> {
  const path = resolveOnnxModelPath(modelId);
  if (!path) throw new Error('ONNX_MODEL_NOT_DOWNLOADED');
  if (!nativeOnnx) throw new Error('ONNX_NATIVE_MODULE_UNAVAILABLE');
  await nativeOnnx.load(modelId, path);
  return { modelId, path };
}

export async function unloadOnnxModel(modelId: string): Promise<void> {
  if (nativeOnnx) await nativeOnnx.unload(modelId);
}