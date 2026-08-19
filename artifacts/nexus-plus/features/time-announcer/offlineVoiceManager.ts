import { File, Directory, Paths } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { OFFLINE_VOICE_MODELS, type OfflineVoiceModel } from './offlineVoiceModels';

const MODEL_DIRECTORY = new Directory(Paths.document, 'tts-models');

export type VoiceInstallProgress = {
  modelId: OfflineVoiceModel['id'];
  downloadedBytes: number;
  totalBytes: number;
  complete: boolean;
};

function modelFile(model: OfflineVoiceModel): File {
  return new File(MODEL_DIRECTORY, model.modelFileName);
}

export function getOfflineVoiceModels(): OfflineVoiceModel[] {
  return OFFLINE_VOICE_MODELS;
}

export function isOfflineVoiceInstalled(model: OfflineVoiceModel): boolean {
  return modelFile(model).exists && modelFile(model).size === model.sizeBytes;
}

/**
 * Downloads the models into app-private document storage. The current Expo
 * Speech engine itself cannot consume Piper ONNX files directly; this manager
 * therefore owns persistence/verification while the speech adapter can later
 * invoke a native Piper runtime with the returned local model path.
 */
export async function downloadOfflineVoiceModel(
  model: OfflineVoiceModel,
  onProgress?: (progress: VoiceInstallProgress) => void,
): Promise<File> {
  MODEL_DIRECTORY.create({ idempotent: true });
  const destination = modelFile(model);

  if (destination.exists && destination.size === model.sizeBytes) {
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
    throw new Error(`Voice model ${model.id} failed verification after download.`);
  }

  onProgress?.({ modelId: model.id, downloadedBytes: model.sizeBytes, totalBytes: model.sizeBytes, complete: true });
  return downloaded;
}

export async function prepareDefaultOfflineVoices(): Promise<void> {
  for (const model of OFFLINE_VOICE_MODELS) {
    if (!isOfflineVoiceInstalled(model)) {
      await downloadOfflineVoiceModel(model);
    }
  }
}

export async function getPreferredDeviceVoice(language: string): Promise<string | undefined> {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices
    .filter((voice) => voice.language?.toLowerCase().startsWith(language.toLowerCase().slice(0, 2)))
    .sort((a, b) => Number(b.quality === 'Enhanced') - Number(a.quality === 'Enhanced'))[0]?.identifier;
}
