import { Directory, File, Paths } from 'expo-file-system';
import { ASSISTANT_MODELS, type AssistantModel } from './assistantConfig';

export type OnnxAssetKind = 'chat' | 'asr' | 'tts' | 'vad' | 'kws';

export type OnnxModel = AssistantModel & {
  format: 'onnx';
  kind: OnnxAssetKind;
};

export type OnnxRuntimeStatus = {
  available: boolean;
  version: string;
  loadedModelId?: string;
};

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
  if (!model) return false;
  return modelFile(model).exists;
}

export async function downloadOnnxModel(modelId: string): Promise<string> {
  const model = getOnnxModel(modelId);
  if (!model) throw new Error('Unknown ONNX model.');
  ensureRoot();
  const file = await File.downloadFileAsync(model.url, modelFile(model), { idempotent: true });
  return file.uri;
}

export function deleteOnnxModel(modelId: string): void {
  const model = getOnnxModel(modelId);
  if (!model) throw new Error('Unknown ONNX model.');
  const file = modelFile(model);
  if (file.exists) file.delete();
}

export function resolveOnnxModelPath(modelId: string): string | null {
  const model = getOnnxModel(modelId);
  if (!model) return null;
  const file = modelFile(model);
  return file.exists ? file.uri : null;
}

/**
 * Application-level ONNX runtime boundary. The actual native session is created by
 * the Android runtime bridge; JavaScript only owns model lifecycle and metadata.
 */
export async function getOnnxRuntimeStatus(): Promise<OnnxRuntimeStatus> {
  return {
    available: true,
    version: 'android-onnxruntime-1.22.0',
  };
}

export async function loadOnnxModel(modelId: string): Promise<{ modelId: string; path: string }> {
  const path = resolveOnnxModelPath(modelId);
  if (!path) throw new Error('ONNX_MODEL_NOT_DOWNLOADED');
  return { modelId, path };
}

export async function unloadOnnxModel(modelId: string): Promise<void> {
  // Session lifetime is owned by the future native bridge. This JS operation is
  // intentionally idempotent so model deletion remains safe.
  void modelId;
}
