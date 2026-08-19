import { File, Directory, Paths } from 'expo-file-system';
import { OFFLINE_VOICE_MODELS, type OfflineVoiceModel } from './offlineVoiceModels';

const MODEL_DIRECTORY = new Directory(Paths.document, 'tts-models');

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

export function getOfflineVoiceModels(): OfflineVoiceModel[] {
  return OFFLINE_VOICE_MODELS;
}

export function isOfflineVoiceInstalled(model: OfflineVoiceModel): boolean {
  return modelFile(model).exists && modelFile(model).size === model.sizeBytes && configFile(model).exists && configFile(model).size > 0;
}

export async function downloadOfflineVoiceModel(
  model: OfflineVoiceModel,
  onProgress?: (progress: VoiceInstallProgress) => void,
): Promise<File> {
  MODEL_DIRECTORY.create({ idempotent: true });
  const destination = modelFile(model);
  const configDestination = configFile(model);

  if (destination.exists && destination.size === model.sizeBytes && configDestination.exists && configDestination.size > 0) {
    onProgress?.({ modelId: model.id, downloadedBytes: model.sizeBytes, totalBytes: model.sizeBytes, complete: true });
    return destination;
  }

  const task = File.createDownloadTask(model.source, destination, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
    onProgress?.({
      modelId: model.id,
      downloadedBytes: totalBytesWritten,
      totalBytes: totalBytesExpectedToWrite || model.sizeBytes,
      complete: false,
    });
  });

  const downloaded = await task.downloadAsync();
  if (!downloaded || !downloaded.exists || downloaded.size !== model.sizeBytes) {
    throw new Error(`Voice model ${model.id} failed size verification after download.`);
  }

  const configTask = File.createDownloadTask(model.configSource, configDestination);
  const config = await configTask.downloadAsync();
  if (!config || !config.exists || config.size <= 0) {
    throw new Error(`Voice model ${model.id} configuration failed verification after download.`);
  }

  onProgress?.({ modelId: model.id, downloadedBytes: model.sizeBytes, totalBytes: model.sizeBytes, complete: true });
  return downloaded;
}

export async function prepareDefaultOfflineVoices(): Promise<void> {
  for (const model of OFFLINE_VOICE_MODELS) {
    if (!isOfflineVoiceInstalled(model)) await downloadOfflineVoiceModel(model);
  }
}
