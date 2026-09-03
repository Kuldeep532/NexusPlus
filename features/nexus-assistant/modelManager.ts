import { Directory, File, Paths } from 'expo-file-system';
import { ASSISTANT_MODELS, ASSISTANT_VOICES, type AssistantModel, type AssistantVoice } from './assistantConfig';

const modelsDir = new Directory(Paths.document, 'nexus-assistant', 'models');
const voicesDir = new Directory(Paths.document, 'nexus-assistant', 'voices');

function ensureDir(directory: Directory): void {
  directory.create({ idempotent: true, intermediates: true });
}

export function getAssistantModels(): AssistantModel[] {
  return [...ASSISTANT_MODELS];
}

export function getAssistantVoices(): AssistantVoice[] {
  return [...ASSISTANT_VOICES];
}

export async function downloadAssistantModel(modelId: string): Promise<string> {
  const model = ASSISTANT_MODELS.find((item) => item.id === modelId);
  if (!model) throw new Error('Unknown Nexus Assistant model.');
  ensureDir(modelsDir);
  const target = new File(modelsDir, `${model.id}.gguf`);
  const file = await File.downloadFileAsync(model.url, target, { idempotent: true });
  return file.uri;
}

export async function deleteAssistantModel(modelId: string): Promise<void> {
  const file = new File(modelsDir, `${modelId}.gguf`);
  if (file.exists) file.delete();
}

export async function downloadAssistantVoice(voiceId: string): Promise<string> {
  const voice = ASSISTANT_VOICES.find((item) => item.id === voiceId);
  if (!voice) throw new Error('Unknown Nexus Assistant voice.');
  ensureDir(voicesDir);
  const target = new File(voicesDir, `${voice.id}.onnx`);
  const file = await File.downloadFileAsync(voice.url, target, { idempotent: true });
  return file.uri;
}

export async function deleteAssistantVoice(voiceId: string): Promise<void> {
  const file = new File(voicesDir, `${voiceId}.onnx`);
  if (file.exists) file.delete();
}
