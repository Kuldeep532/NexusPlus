import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import { VOICE_CATALOG, type VoiceCatalogItem } from './voiceCatalog';

const STORAGE_KEY = 'nexus-plus.voice-library.v3';
const ROOT = new Directory(Paths.document, 'voice-library');
const operationLocks = new Map<string, Promise<InstalledVoice>>();

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

function modelFile(voice: VoiceCatalogItem): File {
  return new File(ROOT, `${voice.id}.onnx`);
}

function configFile(voice: VoiceCatalogItem): File {
  return new File(ROOT, `${voice.id}.onnx.json`);
}

function tempModelFile(voice: VoiceCatalogItem): File {
  return new File(ROOT, `${voice.id}.onnx.download`);
}

function tempConfigFile(voice: VoiceCatalogItem): File {
  return new File(ROOT, `${voice.id}.onnx.json.download`);
}

function safeDelete(file: File): void {
  try {
    if (file.exists) file.delete();
  } catch {
    // Best-effort cleanup only. The original error remains authoritative.
  }
}

function isExpectedSize(file: File, expected?: number): boolean {
  if (!file.exists) return false;
  if (!expected || expected <= 0) return file.size > 0;
  return file.size === expected;
}

async function readInstalled(): Promise<InstalledVoice[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is InstalledVoice =>
      !!item && typeof item === 'object' && typeof (item as InstalledVoice).id === 'string'
      && typeof (item as InstalledVoice).modelPath === 'string'
      && typeof (item as InstalledVoice).configPath === 'string',
    );
  } catch {
    return [];
  }
}

async function writeInstalled(items: InstalledVoice[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function getInstalledVoices(): Promise<InstalledVoice[]> {
  return readInstalled();
}

export async function isVoiceInstalled(voiceId: string): Promise<boolean> {
  const voice = VOICE_CATALOG.find((item) => item.id === voiceId);
  if (!voice) return false;
  return isExpectedSize(modelFile(voice), voice.modelSizeBytes)
    && isExpectedSize(configFile(voice), voice.configSizeBytes);
}

async function installVoice(voice: VoiceCatalogItem, onProgress?: (progress: VoiceDownloadProgress) => void): Promise<InstalledVoice> {
  ROOT.create({ idempotent: true, intermediates: true });

  const model = modelFile(voice);
  const config = configFile(voice);
  const modelTemp = tempModelFile(voice);
  const configTemp = tempConfigFile(voice);

  // Never trust a stale/partial final file. A complete pair is required.
  if (await isVoiceInstalled(voice.id)) {
    const existing = (await readInstalled()).find((item) => item.id === voice.id);
    if (existing) return existing;
  }

  safeDelete(modelTemp);
  safeDelete(configTemp);

  try {
    const modelTask = File.createDownloadTask(voice.modelUrl, modelTemp, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      onProgress?.({
        voiceId: voice.id,
        stage: 'model',
        downloadedBytes: totalBytesWritten,
        totalBytes: totalBytesExpectedToWrite || voice.modelSizeBytes || 0,
      });
    });
    const downloadedModel = await modelTask.downloadAsync();
    if (!downloadedModel?.exists || !isExpectedSize(downloadedModel, voice.modelSizeBytes)) {
      throw new Error(`Voice model ${voice.name} failed integrity verification.`);
    }

    const configTask = File.createDownloadTask(voice.configUrl, configTemp, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      onProgress?.({
        voiceId: voice.id,
        stage: 'config',
        downloadedBytes: totalBytesWritten,
        totalBytes: totalBytesExpectedToWrite || voice.configSizeBytes || 0,
      });
    });
    const downloadedConfig = await configTask.downloadAsync();
    if (!downloadedConfig?.exists || !isExpectedSize(downloadedConfig, voice.configSizeBytes)) {
      throw new Error(`Voice configuration for ${voice.name} failed integrity verification.`);
    }

    // Publish only after both downloads are verified, so runtime never sees a half-installed pair.
    safeDelete(model);
    safeDelete(config);
    modelTemp.move(model);
    configTemp.move(config);

    if (!isExpectedSize(model, voice.modelSizeBytes) || !isExpectedSize(config, voice.configSizeBytes)) {
      safeDelete(model);
      safeDelete(config);
      throw new Error(`Voice ${voice.name} could not be finalized safely.`);
    }

    const installed: InstalledVoice = {
      ...voice,
      installedAt: Date.now(),
      modelPath: model.uri,
      configPath: config.uri,
    };
    const current = await readInstalled();
    await writeInstalled([...current.filter((item) => item.id !== voice.id), installed]);
    onProgress?.({
      voiceId: voice.id,
      stage: 'config',
      downloadedBytes: voice.configSizeBytes || config.size,
      totalBytes: voice.configSizeBytes || config.size,
    });
    return installed;
  } catch (error) {
    safeDelete(modelTemp);
    safeDelete(configTemp);
    // Never leave stale metadata pointing at broken files.
    const current = await readInstalled();
    const retained = current.filter((item) => item.id !== voice.id);
    if (retained.length !== current.length) {
      try { await writeInstalled(retained); } catch { /* preserve primary failure */ }
    }
    throw error instanceof Error ? error : new Error(`Voice ${voice.name} download failed.`);
  }
}

export async function downloadVoice(
  voice: VoiceCatalogItem,
  onProgress?: (progress: VoiceDownloadProgress) => void,
): Promise<InstalledVoice> {
  const active = operationLocks.get(voice.id);
  if (active) return active;

  const operation = installVoice(voice, onProgress).finally(() => {
    operationLocks.delete(voice.id);
  });
  operationLocks.set(voice.id, operation);
  return operation;
}

export async function removeVoice(voiceId: string): Promise<void> {
  const voice = VOICE_CATALOG.find((item) => item.id === voiceId);
  if (!voice) return;
  safeDelete(modelFile(voice));
  safeDelete(configFile(voice));
  safeDelete(tempModelFile(voice));
  safeDelete(tempConfigFile(voice));
  const current = await readInstalled();
  await writeInstalled(current.filter((item) => item.id !== voiceId));
}
