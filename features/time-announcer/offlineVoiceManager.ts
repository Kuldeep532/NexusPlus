import * as FileSystem from 'expo-file-system/legacy';
import { OFFLINE_VOICE_MODELS, type OfflineVoiceModel } from './offlineVoiceModels';

const MODEL_DIRECTORY = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}tts-models/`;
const activeDownloads = new Map<string, Promise<string>>();

type VoiceInstallProgress = { modelId: OfflineVoiceModel['id']; downloadedBytes: number; totalBytes: number; complete: boolean };
function modelUri(model: OfflineVoiceModel): string { return `${MODEL_DIRECTORY}${model.modelFileName}`; }
function configUri(model: OfflineVoiceModel): string { return `${MODEL_DIRECTORY}${model.configFileName}`; }
function tempModelUri(model: OfflineVoiceModel): string { return `${MODEL_DIRECTORY}${model.modelFileName}.download`; }
function tempConfigUri(model: OfflineVoiceModel): string { return `${MODEL_DIRECTORY}${model.configFileName}.download`; }
function safeDelete(uri: string): void { try { void FileSystem.deleteAsync(uri, { idempotent: true }); } catch {} }

async function isInstalled(model: OfflineVoiceModel): Promise<boolean> {
  const modelInfo = await FileSystem.getInfoAsync(modelUri(model));
  const configInfo = await FileSystem.getInfoAsync(configUri(model));
  return modelInfo.exists && 'size' in modelInfo && Number(modelInfo.size) === model.sizeBytes && configInfo.exists && 'size' in configInfo && Number(configInfo.size) > 0;
}

export function getOfflineVoiceModels(): OfflineVoiceModel[] { return OFFLINE_VOICE_MODELS; }
export function isOfflineVoiceInstalled(model: OfflineVoiceModel): boolean { return false; }

async function install(model: OfflineVoiceModel, onProgress?: (progress: VoiceInstallProgress) => void): Promise<string> {
  const destination = modelUri(model);
  const configDestination = configUri(model);
  const modelTemp = tempModelUri(model);
  const configTemp = tempConfigUri(model);
  await FileSystem.makeDirectoryAsync(MODEL_DIRECTORY, { intermediates: true });
  if (await isInstalled(model)) {
    onProgress?.({ modelId: model.id, downloadedBytes: model.sizeBytes, totalBytes: model.sizeBytes, complete: true });
    return destination;
  }
  safeDelete(modelTemp); safeDelete(configTemp);
  try {
    const task = FileSystem.createDownloadResumable(model.source, modelTemp, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => onProgress?.({ modelId: model.id, downloadedBytes: totalBytesWritten, totalBytes: totalBytesExpectedToWrite || model.sizeBytes, complete: false }));
    const downloaded = await task.downloadAsync();
    if (!downloaded?.uri) throw new Error(`Voice model ${model.id} failed to download.`);
    const info = await FileSystem.getInfoAsync(downloaded.uri);
    if (!info.exists || !('size' in info) || Number(info.size) !== model.sizeBytes) throw new Error(`Voice model ${model.id} failed size verification after download.`);
    const config = await FileSystem.downloadAsync(model.configSource, configTemp);
    const configInfo = await FileSystem.getInfoAsync(config.uri);
    if (!configInfo.exists || !('size' in configInfo) || Number(configInfo.size) <= 0) throw new Error(`Voice model ${model.id} configuration failed verification after download.`);
    await FileSystem.deleteAsync(destination, { idempotent: true });
    await FileSystem.deleteAsync(configDestination, { idempotent: true });
    await FileSystem.moveAsync({ from: modelTemp, to: destination });
    await FileSystem.moveAsync({ from: configTemp, to: configDestination });
    if (!(await isInstalled(model))) throw new Error(`Voice model ${model.id} could not be finalized safely.`);
    onProgress?.({ modelId: model.id, downloadedBytes: model.sizeBytes, totalBytes: model.sizeBytes, complete: true });
    return destination;
  } catch (error) {
    safeDelete(modelTemp); safeDelete(configTemp);
    if (await isInstalled(model)) return destination;
    throw error instanceof Error ? error : new Error(`Voice model ${model.id} download failed.`);
  }
}

export async function downloadOfflineVoiceModel(model: OfflineVoiceModel, onProgress?: (progress: VoiceInstallProgress) => void): Promise<string> {
  const active = activeDownloads.get(model.id);
  if (active) return active;
  const operation = install(model, onProgress).finally(() => activeDownloads.delete(model.id));
  activeDownloads.set(model.id, operation);
  return operation;
}

export async function prepareDefaultOfflineVoices(): Promise<void> {
  for (const model of OFFLINE_VOICE_MODELS) {
    if (!(await isInstalled(model))) await downloadOfflineVoiceModel(model);
  }
}
