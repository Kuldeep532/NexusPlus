import * as FileSystem from 'expo-file-system/legacy';

export type VoiceStudioModel = {
  id: string;
  name: string;
  uri: string;
  kind: 'onnx';
  source: 'app' | 'device-folder';
  createdAt: number;
};

const VOICE_MODELS_DIR = `${FileSystem.documentDirectory ?? ''}Nexus Plus/Voices/Voice Models/`;
const INDEX_URI = `${VOICE_MODELS_DIR}index.json`;

function sanitizeName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Voice Model';
}

async function ensureDirectory(): Promise<void> {
  if (!FileSystem.documentDirectory) throw new Error('Nexus Plus local storage is unavailable.');
  await FileSystem.makeDirectoryAsync(VOICE_MODELS_DIR, { intermediates: true });
}

async function saveIndex(models: VoiceStudioModel[]): Promise<void> {
  await FileSystem.writeAsStringAsync(INDEX_URI, JSON.stringify(models));
}

export async function loadVoiceStudioModels(): Promise<VoiceStudioModel[]> {
  await ensureDirectory();
  try {
    const info = await FileSystem.getInfoAsync(INDEX_URI);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(INDEX_URI);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && item.kind === 'onnx' && typeof item.uri === 'string');
  } catch {
    return [];
  }
}

export async function importVoiceStudioOnnx(uri: string, displayName?: string): Promise<VoiceStudioModel> {
  if (!uri) throw new Error('Choose an ONNX voice model file.');
  await ensureDirectory();
  const baseName = sanitizeName(displayName || uri.split('/').pop()?.replace(/\.onnx$/i, '') || 'Voice Model');
  const destination = `${VOICE_MODELS_DIR}${baseName}-${Date.now()}.onnx`;
  await FileSystem.copyAsync({ from: uri, to: destination });
  const model: VoiceStudioModel = { id: `onnx-${Date.now()}`, name: baseName, uri: destination, kind: 'onnx', source: 'app', createdAt: Date.now() };
  const current = await loadVoiceStudioModels();
  await saveIndex([model, ...current]);
  return model;
}

export async function syncVoiceStudioFolder(): Promise<VoiceStudioModel[]> {
  await ensureDirectory();
  const entries = await FileSystem.readDirectoryAsync(VOICE_MODELS_DIR);
  const existing = await loadVoiceStudioModels();
  const byUri = new Map(existing.map((item) => [item.uri, item]));
  for (const entry of entries) {
    if (!entry.toLowerCase().endsWith('.onnx') || entry === 'index.json') continue;
    const uri = `${VOICE_MODELS_DIR}${entry}`;
    if (!byUri.has(uri)) {
      const name = sanitizeName(entry.replace(/\.onnx$/i, ''));
      byUri.set(uri, { id: `device-${entry}`, name, uri, kind: 'onnx', source: 'device-folder', createdAt: Date.now() });
    }
  }
  const models = Array.from(byUri.values());
  await saveIndex(models);
  return models;
}

export async function getVoiceStudioModel(id: string): Promise<VoiceStudioModel | null> {
  const models = await syncVoiceStudioFolder();
  return models.find((item) => item.id === id) ?? null;
}
