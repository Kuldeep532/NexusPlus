import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import { UNIQUE_VOICE_CATALOG, type VoiceCatalogItem } from './voiceCatalog';
import { acquireVoiceDownloadSlot, releaseVoiceDownloadSlot } from './voiceDownloadGuard';
import { finishSupabaseVoiceDownload, tryStartSupabaseVoiceDownload, type DownloadGateDeviceInfo } from './supabaseDownloadGate';

const STORAGE_KEY = 'nexus-plus.voice-library.v4';
const LEGACY_STORAGE_KEYS = ['nexus-plus.voice-library.v3', 'nexus-plus.voice-library.v2'];
const ROOT = new Directory(Paths.document, 'voice-library');
const operationLocks = new Map<string, Promise<InstalledVoice>>();

type SupabaseDownloadSession = { userId: string; accessToken: string };
let supabaseDownloadSessionProvider: (() => Promise<SupabaseDownloadSession | null>) | null = null;
let deviceInfoProvider: (() => DownloadGateDeviceInfo | undefined) | null = null;

export function configureSupabaseVoiceDownloadGate(
  provider: (() => Promise<SupabaseDownloadSession | null>) | null,
  getDeviceInfo?: (() => DownloadGateDeviceInfo | undefined) | null,
): void {
  supabaseDownloadSessionProvider = provider;
  deviceInfoProvider = getDeviceInfo ?? null;
}

export type InstalledVoice = VoiceCatalogItem & { installedAt: number; modelPath: string; configPath: string };
export type VoiceDownloadProgress = { voiceId: string; stage: 'model' | 'config'; downloadedBytes: number; totalBytes: number };

const findVoice = (voiceId: string) => UNIQUE_VOICE_CATALOG.find((item) => item.id === voiceId);
const modelFile = (voice: VoiceCatalogItem) => new File(ROOT, `${voice.id}.onnx`);
const configFile = (voice: VoiceCatalogItem) => new File(ROOT, `${voice.id}.onnx.json`);
const tempModelFile = (voice: VoiceCatalogItem) => new File(ROOT, `${voice.id}.onnx.download`);
const tempConfigFile = (voice: VoiceCatalogItem) => new File(ROOT, `${voice.id}.onnx.json.download`);
function safeDelete(file: File) { try { if (file.exists) file.delete(); } catch {} }
function validFile(file: File, expected?: number) { return file.exists && (!expected || expected <= 0 ? file.size > 0 : file.size === expected); }
function validRecord(value: unknown): value is InstalledVoice {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<InstalledVoice>;
  return typeof item.id === 'string' && typeof item.modelPath === 'string' && typeof item.configPath === 'string' && typeof item.installedAt === 'number';
}

async function readInstalled(): Promise<InstalledVoice[]> {
  try {
    const current = await AsyncStorage.getItem(STORAGE_KEY);
    if (current) {
      const parsed: unknown = JSON.parse(current);
      if (Array.isArray(parsed)) return parsed.filter(validRecord);
    }
    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = await AsyncStorage.getItem(key);
      if (!legacy) continue;
      const parsed: unknown = JSON.parse(legacy);
      if (!Array.isArray(parsed)) continue;
      const migrated = parsed.filter(validRecord).filter((item) => !!findVoice(item.id));
      if (migrated.length) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  return [];
}

async function writeInstalled(items: InstalledVoice[]) { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

export async function getInstalledVoices(): Promise<InstalledVoice[]> {
  const records = await readInstalled();
  const repaired: InstalledVoice[] = [];
  for (const record of records) {
    const voice = findVoice(record.id);
    if (!voice) continue;
    if (validFile(modelFile(voice), voice.modelSizeBytes) && validFile(configFile(voice), voice.configSizeBytes)) {
      repaired.push({ ...record, ...voice, modelPath: modelFile(voice).uri, configPath: configFile(voice).uri });
    }
  }
  if (repaired.length !== records.length) { try { await writeInstalled(repaired); } catch {} }
  return repaired;
}

export async function isVoiceInstalled(voiceId: string): Promise<boolean> {
  const voice = findVoice(voiceId);
  return !!voice && validFile(modelFile(voice), voice.modelSizeBytes) && validFile(configFile(voice), voice.configSizeBytes);
}

async function releaseSupabaseSession(session: SupabaseDownloadSession): Promise<void> {
  try { await finishSupabaseVoiceDownload(session.userId, session.accessToken); } catch { /* never mask the original download error */ }
}

async function installVoice(voice: VoiceCatalogItem, onProgress?: (progress: VoiceDownloadProgress) => void): Promise<InstalledVoice> {
  ROOT.create({ idempotent: true, intermediates: true });
  const model = modelFile(voice); const config = configFile(voice); const modelTemp = tempModelFile(voice); const configTemp = tempConfigFile(voice);
  if (await isVoiceInstalled(voice.id)) {
    const existing = (await getInstalledVoices()).find((item) => item.id === voice.id);
    if (existing) return existing;
  }

  acquireVoiceDownloadSlot(voice.id);
  let supabaseSession: SupabaseDownloadSession | null = null;
  try {
    if (supabaseDownloadSessionProvider) {
      supabaseSession = await supabaseDownloadSessionProvider();
      if (supabaseSession) {
        await tryStartSupabaseVoiceDownload(supabaseSession.userId, supabaseSession.accessToken, deviceInfoProvider?.());
      }
    }

    safeDelete(modelTemp); safeDelete(configTemp);
    const modelDownload = await File.createDownloadTask(voice.modelUrl, modelTemp, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => onProgress?.({ voiceId: voice.id, stage: 'model', downloadedBytes: totalBytesWritten, totalBytes: totalBytesExpectedToWrite || voice.modelSizeBytes || 0 })).downloadAsync();
    if (!modelDownload?.exists || !validFile(modelDownload, voice.modelSizeBytes)) throw new Error(`Voice model ${voice.name} failed integrity verification.`);
    const configDownload = await File.createDownloadTask(voice.configUrl, configTemp, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => onProgress?.({ voiceId: voice.id, stage: 'config', downloadedBytes: totalBytesWritten, totalBytes: totalBytesExpectedToWrite || voice.configSizeBytes || 0 })).downloadAsync();
    if (!configDownload?.exists || !validFile(configDownload, voice.configSizeBytes)) throw new Error(`Voice configuration for ${voice.name} failed integrity verification.`);
    safeDelete(model); safeDelete(config); modelTemp.move(model); configTemp.move(config);
    if (!validFile(model, voice.modelSizeBytes) || !validFile(config, voice.configSizeBytes)) throw new Error(`Voice ${voice.name} could not be finalized safely.`);
    const installed = { ...voice, installedAt: Date.now(), modelPath: model.uri, configPath: config.uri } as InstalledVoice;
    const current = await getInstalledVoices();
    await writeInstalled([...current.filter((item) => item.id !== voice.id), installed]);
    return installed;
  } catch (error) { safeDelete(modelTemp); safeDelete(configTemp); throw error instanceof Error ? error : new Error(`Voice ${voice.name} download failed.`); }
  finally {
    releaseVoiceDownloadSlot(voice.id);
    if (supabaseSession) await releaseSupabaseSession(supabaseSession);
  }
}

export async function downloadVoice(voice: VoiceCatalogItem, onProgress?: (progress: VoiceDownloadProgress) => void): Promise<InstalledVoice> {
  const canonical = findVoice(voice.id);
  if (!canonical) throw new Error('Unknown voice.');
  const active = operationLocks.get(canonical.id); if (active) return active;
  const operation = installVoice(canonical, onProgress).finally(() => operationLocks.delete(canonical.id)); operationLocks.set(canonical.id, operation); return operation;
}

export async function removeVoice(voiceId: string): Promise<void> {
  const voice = findVoice(voiceId); if (!voice) return;
  const active = operationLocks.get(voiceId); if (active) await active.catch(() => undefined);
  safeDelete(modelFile(voice)); safeDelete(configFile(voice)); safeDelete(tempModelFile(voice)); safeDelete(tempConfigFile(voice));
  await writeInstalled((await getInstalledVoices()).filter((item) => item.id !== voiceId));
}
