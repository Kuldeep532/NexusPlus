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
};

const nativeOnnx = NativeModules.NexusAssistantOnnx as NativeOnnxModule | undefined;
const root = new Directory(Paths.document, 'nexus-assistant', 'onnx');

function modelFile(model: OnnxModel): File {
  return new File(root, `${model.id}.onnx`);
}

function ensureRoot(): void {
  root.create({ idempotent: true, intermediates: true });
}

export function getOnnxModels(kind?: OnnxAssetKind): OnnxModel[] {
  return ASSISTANT_MODELS.filter((item) => item.format === 'onnx' && (!kind || item.kind === kind)) as OnnxModel[];
}

export function getOnnxModel(modelId: string): OnnxModel | null {
  return getOnnxModels().find((item) => item.id === modelId) ?? null;
}

export function isOnnxModelDownloaded(modelId: string): boolean {
  const model = getOnnxModel(modelId);
  return !!model && modelFile(model).exists;
}

export async function downloadOnnxModel(modelId: string): Promise<string> {
  const model = getOnnxModel(modelId);
  if (!model) throw new Error('UNKNOWN_ONNX_MODEL');
  ensureRoot();
  const file = await File.downloadFileAsync(model.url, modelFile(model), { idempotent: true });
  return file.uri;
}

export function deleteOnnxModel(modelId: string): void {
  const model = getOnnxModel(modelId);
  if (!model) throw new Error('UNKNOWN_ONNX_MODEL');
  const file = modelFile(model);
  if (file.exists) file.delete();
}

export function resolveOnnxModelPath(modelId: string): string | null {
  const model = getOnnxModel(modelId);
  if (!model) return null;
  const file = modelFile(model);
  return file.exists ? file.uri : null;
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
