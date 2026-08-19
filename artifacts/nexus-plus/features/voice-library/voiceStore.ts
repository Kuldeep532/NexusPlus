import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import { VOICE_CATALOG, type VoiceCatalogItem } from './voiceCatalog';

const STORAGE_KEY = 'nexus-plus.voice-library.v2';
const ROOT = new Directory(Paths.document, 'voice-library');

export type InstalledVoice = VoiceCatalogItem & {
  installedAt: number;
  modelPath: string;
  configPath: string;
};

export type VoiceDownloadProgress = {
  voiceId: string;
  stage: 'model' | 'config';
  downloadedBytes: number;
  totalBytes: number;
};

function modelFile(voice: VoiceCatalogItem) {
  return new File(ROOT, `${voice.id}.onnx`);
}

function configFile(voice: VoiceCatalogItem) {
  return new File(ROOT, `${voice.id}.onnx.json`);
}

async function readInstalled(): Promise<InstalledVoice[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as InstalledVoice[];
  } catch {
    return [];
  }
}

async function writeInstalled(items: InstalledVoice[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function getInstalledVoices(): Promise<InstalledVoice[]> {
  return readInstalled();
}

export async function isVoiceInstalled(voiceId: string): Promise<boolean> {
  const voice = VOICE_CATALOG.find((item) => item.id === voiceId);
  if (!voice) return false;
  const model = modelFile(voice);
  const config = configFile(voice);
  return model.exists && config.exists;
}

export async function downloadVoice(voice: VoiceCatalogItem, onProgress?: (progress: VoiceDownloadProgress) => void): Promise<InstalledVoice> {
  ROOT.create({ idempotent: true });
  const model = modelFile(voice);
  const config = configFile(voice);

  const modelTask = File.createDownloadTask(voice.modelUrl, model, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
    onProgress?.({ voiceId: voice.id, stage: 'model', downloadedBytes: totalBytesWritten, totalBytes: totalBytesExpectedToWrite || voice.modelSizeBytes || 0 });
  });
  await modelTask.downloadAsync();

  const configTask = File.createDownloadTask(voice.configUrl, config, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
    onProgress?.({ voiceId: voice.id, stage: 'config', downloadedBytes: totalBytesWritten, totalBytes: totalBytesExpectedToWrite || voice.configSizeBytes || 0 });
  });
  await configTask.downloadAsync();

  if (!model.exists || !config.exists) throw new Error(`Voice ${voice.name} could not be installed.`);

  const installed: InstalledVoice = {
    ...voice,
    installedAt: Date.now(),
    modelPath: model.uri,
    configPath: config.uri,
  };
  const current = await readInstalled();
  await writeInstalled([...current.filter((item) => item.id !== voice.id), installed]);
  return installed;
}

export async function removeVoice(voiceId: string): Promise<void> {
  const voice = VOICE_CATALOG.find((item) => item.id === voiceId);
  if (!voice) return;
  const model = modelFile(voice);
  const config = configFile(voice);
  if (model.exists) model.delete();
  if (config.exists) config.delete();
  const current = await readInstalled();
  await writeInstalled(current.filter((item) => item.id !== voiceId));
}
