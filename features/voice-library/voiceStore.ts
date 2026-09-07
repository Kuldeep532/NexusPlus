import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { UNIQUE_VOICE_CATALOG, type VoiceCatalogItem } from './voiceCatalog';
import { acquireVoiceDownloadSlot, releaseVoiceDownloadSlot } from './voiceDownloadGuard';
import { finishSupabaseVoiceDownload, tryStartSupabaseVoiceDownload, type DownloadGateDeviceInfo } from './supabaseDownloadGate';

const STORAGE_KEY = 'nexus-plus.voice-library.v4';
const LEGACY_STORAGE_KEYS = ['nexus-plus.voice-library.v3', 'nexus-plus.voice-library.v2'];
const ROOT = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}voice-library/`;
const operationLocks = new Map<string, Promise<InstalledVoice>>();

type SupabaseDownloadSession = { userId: string; accessToken: string };
let supabaseDownloadSessionProvider: (() => Promise<SupabaseDownloadSession | null>) | null = null;
let deviceInfoProvider: (() => DownloadGateDeviceInfo | undefined) | null = null;
export function configureSupabaseVoiceDownloadGate(provider: (() => Promise<SupabaseDownloadSession | null>) | null, getDeviceInfo?: (() => DownloadGateDeviceInfo | undefined) | null): void { supabaseDownloadSessionProvider = provider; deviceInfoProvider = getDeviceInfo ?? null; }
export type InstalledVoice = VoiceCatalogItem & { installedAt: number; modelPath: string; configPath: string };
export type VoiceDownloadProgress = { voiceId: string; stage: 'model' | 'config'; downloadedBytes: number; totalBytes: number };
const findVoice = (voiceId: string) => UNIQUE_VOICE_CATALOG.find((item) => item.id === voiceId);
const modelUri = (voice: VoiceCatalogItem) => `${ROOT}${voice.id}.onnx`;
const configUri = (voice: VoiceCatalogItem) => `${ROOT}${voice.id}.onnx.json`;
const tempModelUri = (voice: VoiceCatalogItem) => `${ROOT}${voice.id}.onnx.download`;
const tempConfigUri = (voice: VoiceCatalogItem) => `${ROOT}${voice.id}.onnx.json.download`;
async function safeDelete(uri: string) { try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {} }
async function validFile(uri: string, expected?: number) { const info = await FileSystem.getInfoAsync(uri); return info.exists && 'size' in info && Number(info.size) > 0 && (!expected || expected <= 0 || Number(info.size) === expected); }
function validRecord(value: unknown): value is InstalledVoice { if (!value || typeof value !== 'object') return false; const item = value as Partial<InstalledVoice>; return typeof item.id === 'string' && typeof item.modelPath === 'string' && typeof item.configPath === 'string' && typeof item.installedAt === 'number'; }
async function readInstalled(): Promise<InstalledVoice[]> { try { const current = await AsyncStorage.getItem(STORAGE_KEY); if (current) { const parsed: unknown = JSON.parse(current); if (Array.isArray(parsed)) return parsed.filter(validRecord); } for (const key of LEGACY_STORAGE_KEYS) { const legacy = await AsyncStorage.getItem(key); if (!legacy) continue; const parsed: unknown = JSON.parse(legacy); if (!Array.isArray(parsed)) continue; const migrated = parsed.filter(validRecord).filter((item) => !!findVoice(item.id)); if (migrated.length) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); return migrated; } } catch {} return []; }
async function writeInstalled(items: InstalledVoice[]) { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
export async function getInstalledVoices(): Promise<InstalledVoice[]> { const records = await readInstalled(); const repaired: InstalledVoice[] = []; for (const record of records) { const voice = findVoice(record.id); if (!voice) continue; if (await validFile(modelUri(voice), voice.modelSizeBytes) && await validFile(configUri(voice), voice.configSizeBytes)) repaired.push({ ...record, ...voice, modelPath: modelUri(voice), configPath: configUri(voice) }); } if (repaired.length !== records.length) { try { await writeInstalled(repaired); } catch {} } return repaired; }
export async function isVoiceInstalled(voiceId: string): Promise<boolean> { const voice = findVoice(voiceId); return !!voice && await validFile(modelUri(voice), voice.modelSizeBytes) && await validFile(configUri(voice), voice.configSizeBytes); }
async function releaseSupabaseSession(session: SupabaseDownloadSession): Promise<void> { try { await finishSupabaseVoiceDownload(session.userId, session.accessToken); } catch {} }
async function downloadWithProgress(url: string, destination: string, onProgress?: (bytes: number, total: number) => void): Promise<string> {
  const task = FileSystem.createDownloadResumable(url, destination, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => onProgress?.(totalBytesWritten, totalBytesExpectedToWrite));
  const result = await task.downloadAsync();
  if (!result?.uri) throw new Error('Download did not produce a file.');
  return result.uri;
}
async function installVoice(voice: VoiceCatalogItem, onProgress?: (progress: VoiceDownloadProgress) => void): Promise<InstalledVoice> {
  await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });
  const model = modelUri(voice); const config = configUri(voice); const modelTemp = tempModelUri(voice); const configTemp = tempConfigUri(voice);
  if (await isVoiceInstalled(voice.id)) { const existing = (await getInstalledVoices()).find((item) => item.id === voice.id); if (existing) return existing; }
  acquireVoiceDownloadSlot(voice.id); let supabaseSession: SupabaseDownloadSession | null = null;
  try {
    if (supabaseDownloadSessionProvider) { supabaseSession = await supabaseDownloadSessionProvider(); if (supabaseSession) await tryStartSupabaseVoiceDownload(supabaseSession.userId, supabaseSession.accessToken, deviceInfoProvider?.()); }
    await safeDelete(modelTemp); await safeDelete(configTemp);
    const modelUriDownloaded = await downloadWithProgress(voice.modelUrl, modelTemp, (bytes, total) => onProgress?.({ voiceId: voice.id, stage: 'model', downloadedBytes: bytes, totalBytes: total || voice.modelSizeBytes || 0 }));
    if (!(await validFile(modelUriDownloaded, voice.modelSizeBytes))) throw new Error(`Voice model ${voice.name} failed integrity verification.`);
    const configUriDownloaded = await FileSystem.downloadAsync(voice.configUrl, configTemp);
    if (!(await validFile(configUriDownloaded.uri, voice.configSizeBytes))) throw new Error(`Voice configuration for ${voice.name} failed integrity verification.`);
    await safeDelete(model); await safeDelete(config); await FileSystem.moveAsync({ from: modelTemp, to: model }); await FileSystem.moveAsync({ from: configTemp, to: config });
    if (!(await validFile(model, voice.modelSizeBytes)) || !(await validFile(config, voice.configSizeBytes))) throw new Error(`Voice ${voice.name} could not be finalized safely.`);
    const installed = { ...voice, installedAt: Date.now(), modelPath: model, configPath: config } as InstalledVoice; const current = await getInstalledVoices(); await writeInstalled([...current.filter((item) => item.id !== voice.id), installed]); return installed;
  } catch (error) { await safeDelete(modelTemp); await safeDelete(configTemp); throw error instanceof Error ? error : new Error(`Voice ${voice.name} download failed.`); }
  finally { releaseVoiceDownloadSlot(voice.id); if (supabaseSession) await releaseSupabaseSession(supabaseSession); }
}
export async function downloadVoice(voice: VoiceCatalogItem, onProgress?: (progress: VoiceDownloadProgress) => void): Promise<InstalledVoice> { const canonical = findVoice(voice.id); if (!canonical) throw new Error('Unknown voice.'); const active = operationLocks.get(canonical.id); if (active) return active; const operation = installVoice(canonical, onProgress).finally(() => operationLocks.delete(canonical.id)); operationLocks.set(canonical.id, operation); return operation; }
export async function removeVoice(voiceId: string): Promise<void> { const voice = findVoice(voiceId); if (!voice) return; const active = operationLocks.get(voiceId); if (active) await active.catch(() => undefined); await safeDelete(modelUri(voice)); await safeDelete(configUri(voice)); await safeDelete(tempModelUri(voice)); await safeDelete(tempConfigUri(voice)); await writeInstalled((await getInstalledVoices()).filter((item) => item.id !== voiceId)); }
