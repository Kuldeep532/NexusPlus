import { File, Directory, Paths } from 'expo-file-system';
import { OFFLINE_VOICE_MODELS, type OfflineVoiceModel } from './offlineVoiceModels';

const MODEL_DIRECTORY = new Directory(Paths.document, 'tts-models');
const activeDownloads = new Map<string, Promise<File>>();

type VoiceInstallProgress = {
  modelId: OfflineVoiceModel['id'];
  downloadedBytes: number;
  totalBytes: number;
  complete: boolean;
};

function modelFile(model: OfflineVoiceModel): File {
  return new File(MODEL_DIRECTORY, model.modelFileName);
}

function configFile(model: OfflineVoiceModel): File {
  return new File(MODEL_DIRECTORY, model.configFileName);
}

function tempModelFile(model: OfflineVoiceModel): File {
  return new File(MODEL_DIRECTORY, `${model.modelFileName}.download`);
}

function tempConfigFile(model: OfflineVoiceModel): File {
  return new File(MODEL_DIRECTORY, `${model.configFileName}.download`);
}

function safeDelete(file: File): void {
  try { if (file.exists) file.delete(); } catch { /* best-effort cleanup */ }
}

function isInstalled(model: OfflineVoiceModel): boolean {
  const modelTarget = modelFile(model);
  const configTarget = configFile(model);
  return modelTarget.exists && modelTarget.size === model.sizeBytes && configTarget.exists && configTarget.size > 0;
}

export function getOfflineVoiceModels(): OfflineVoiceModel[] {
  return OFFLINE_VOICE_MODELS;
}

export function isOfflineVoiceInstalled(model: OfflineVoiceModel): boolean {
  return isInstalled(model);
}

async function install(model: OfflineVoiceModel, onProgress?: (progress: VoiceInstallProgress) => void): Promise<File> {
  MODEL_DIRECTORY.create({ idempotent: true, intermediates: true });
  const destination = modelFile(model);
  const configDestination = configFile(model);
  const modelTemp = tempModelFile(model);
  const configTemp = tempConfigFile(model);

  if (isInstalled(model)) {
    onProgress?.({ modelId: model.id, downloadedBytes: model.sizeBytes, totalBytes: model.sizeBytes, complete: true });
    return destination;
  }

  safeDelete(modelTemp);
  safeDelete(configTemp);

  try {
    const task = File.createDownloadTask(model.source, modelTemp, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      onProgress?.({
        modelId: model.id,
        downloadedBytes: totalBytesWritten,
        totalBytes: totalBytesExpectedToWrite || model.sizeBytes,
        complete: false,
      });
    });

    const downloaded = await task.downloadAsync();
    if (!downloaded?.exists || downloaded.size !== model.sizeBytes) {
      throw new Error(`Voice model ${model.id} failed size verification after download.`);
    }

    const configTask = File.createDownloadTask(model.configSource, configTemp);
    const config = await configTask.downloadAsync();
    if (!config?.exists || config.size <= 0) {
      throw new Error(`Voice model ${model.id} configuration failed verification after download.`);
    }

    safeDelete(destination);
    safeDelete(configDestination);
    modelTemp.move(destination);
    configTemp.move(configDestination);

    if (!isInstalled(model)) {
      safeDelete(destination);
      safeDelete(configDestination);
      throw new Error(`Voice model ${model.id} could not be finalized safely.`);
    }

    onProgress?.({ modelId: model.id, downloadedBytes: model.sizeBytes, totalBytes: model.sizeBytes, complete: true });
    return destination;
  } catch (error) {
    safeDelete(modelTemp);
    safeDelete(configTemp);
    // Do not destroy an already-valid previous install because a refresh failed.
    if (isInstalled(model)) return destination;
    throw error instanceof Error ? error : new Error(`Voice model ${model.id} download failed.`);
  }
}

export async function downloadOfflineVoiceModel(
  model: OfflineVoiceModel,
  onProgress?: (progress: VoiceInstallProgress) => void,
): Promise<File> {
  const active = activeDownloads.get(model.id);
  if (active) return active;
  const operation = install(model, onProgress).finally(() => activeDownloads.delete(model.id));
  activeDownloads.set(model.id, operation);
  return operation;
}

export async function prepareDefaultOfflineVoices(): Promise<void> {
  for (const model of OFFLINE_VOICE_MODELS) {
    if (!isOfflineVoiceInstalled(model)) await downloadOfflineVoiceModel(model);
  }
}
