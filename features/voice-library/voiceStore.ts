import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import { VOICE_CATALOG, type VoiceCatalogItem } from './voiceCatalog';

const STORAGE_KEY = 'nexus-plus.voice-library.v3';
const LEGACY_STORAGE_KEY = 'nexus-plus.voice-library.v2';
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
    // Best-effort cleanup only. Preserve the primary operation error.
  }
}

function isExpectedSize(file: File, expected?: number): boolean {
  if (!file.exists) return false;
  if (!expected || expected <= 0) return file.size > 0;
  return file.size === expected;
}

function validInstalledRecord(item: unknown): item is InstalledVoice {
  if (!item || typeof item !== 'object') return false;
  const value = item as Partial<InstalledVoice>;
  return typeof value.id === 'string'
    && typeof value.modelPath === 'string'
    && typeof value.configPath === 'string'
    && typeof value.installedAt === 'number';
}

async function readInstalled(): Promise<InstalledVoice[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(validInstalledRecord);
    }

    // Migrate the previous metadata key so app updates do not make valid
    // downloaded voices disappear from the library.
    const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return [];
    const legacyParsed: unknown = JSON.parse(legacyRaw);
    if (!Array.isArray(legacyParsed)) return [];
    const legacy = legacyParsed.filter(validInstalledRecord);
    if (legacy.length) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
    return legacy;
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

  if (await isVoiceInstalled(voice.id)) {
    const current = await readInstalled();
    const existing = current.find((item) => item.id === voice.id);
    if (existing) return existing;

    // Repair metadata from an older/broken app-state write without forcing a
    // multi-hundred-megabyte re-download when both files are valid.
    const repaired: InstalledVoice = {
      ...voice,
      installedAt: Date.now(),
      modelPath: model.uri,
      configPath: config.uri,
    };
    await writeInstalled([...current.filter((item) => item.id !== voice.id), repaired]);
    return repaired;
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

    // Publish only after both parts are verified, so runtime never sees a
    // partially installed voice pair.
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

  const active = operationLocks.get(voiceId);
  if (active) await active.catch(() => undefined);

  const model = modelFile(voice);
  const config = configFile(voice);
  safeDelete(model);
  safeDelete(config);
  safeDelete(tempModelFile(voice));
  safeDelete(tempConfigFile(voice));

  const current = await readInstalled();
  await writeInstalled(current.filter((item) => item.id !== voiceId));
}
