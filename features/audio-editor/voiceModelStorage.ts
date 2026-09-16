import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';

export type VoiceModelKind = 'onnx' | 'audio-reference';

export type StoredVoiceModel = {
  id: string;
  name: string;
  kind: VoiceModelKind;
  uri: string;
  createdAt: number;
};

const ROOT = `${FileSystem.documentDirectory ?? ''}Nexus Plus/voice models/`;

function sanitizeName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Voice Model';
}

async function ensureRoot(): Promise<void> {
  if (!FileSystem.documentDirectory) throw new Error('Nexus Plus local storage is unavailable.');
  await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });
}

export async function loadStoredVoiceModels(): Promise<StoredVoiceModel[]> {
  await ensureRoot();
  const indexUri = `${ROOT}index.json`;
  try {
    const info = await FileSystem.getInfoAsync(indexUri);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(indexUri);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string' && typeof item.uri === 'string');
  } catch {
    return [];
  }
}

async function saveIndex(models: StoredVoiceModel[]): Promise<void> {
  await FileSystem.writeAsStringAsync(`${ROOT}index.json`, JSON.stringify(models));
}

export async function importVoiceModel(uri: string, name: string, kind: VoiceModelKind): Promise<StoredVoiceModel> {
  if (!uri) throw new Error('A voice model file is required.');
  await ensureRoot();
  const safeName = sanitizeName(name);
  const extension = kind === 'onnx' ? 'onnx' : 'wav';
  const destination = `${ROOT}${safeName}-${Date.now()}.${extension}`;
  await FileSystem.copyAsync({ from: uri, to: destination });
  const model: StoredVoiceModel = { id: `${kind}-${Date.now()}`, name: safeName, kind, uri: destination, createdAt: Date.now() };
  const models = await loadStoredVoiceModels();
  await saveIndex([model, ...models]);
  return model;
}

export async function removeVoiceModel(id: string): Promise<void> {
  const models = await loadStoredVoiceModels();
  const target = models.find((model) => model.id === id);
  if (target) await FileSystem.deleteAsync(target.uri, { idempotent: true });
  await saveIndex(models.filter((model) => model.id !== id));
}
