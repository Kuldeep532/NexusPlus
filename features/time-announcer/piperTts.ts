import { File, Directory, Paths } from 'expo-file-system';
import { OFFLINE_VOICE_MODELS, type OfflineVoiceModel } from './offlineVoiceModels';
import { downloadOfflineVoiceModel, isOfflineVoiceInstalled } from './offlineVoiceManager';

type PiperLanguage = 'en' | 'hi';

const MODEL_DIRECTORY = new Directory(Paths.document, 'tts-models');

function modelForLanguage(language: string): OfflineVoiceModel {
  const normalized = language.toLowerCase();
  return normalized.startsWith('hi')
    ? OFFLINE_VOICE_MODELS.find((model) => model.id === 'hi-IN-priyamvada-medium')!
    : OFFLINE_VOICE_MODELS.find((model) => model.id === 'en-US-lessac-medium')!;
}

export async function ensurePiperVoice(language: string): Promise<File> {
  const model = modelForLanguage(language);
  if (isOfflineVoiceInstalled(model)) {
    return new File(MODEL_DIRECTORY, model.modelFileName);
  }
  return downloadOfflineVoiceModel(model);
}

/**
 * Native bridge boundary for Piper inference.
 *
 * The JS layer deliberately exposes a typed adapter instead of pretending
 * that Expo Speech can execute ONNX files. The Android development build
 * should provide the `nexus-piper` native module with:
 *   synthesize(text, modelPath, configPath, outputWavPath)
 * returning a local WAV path.
 */
export async function speakWithPiper(text: string, language: PiperLanguage): Promise<boolean> {
  const model = await ensurePiperVoice(language === 'hi' ? 'hi-IN' : 'en-IN');
  const globalAny = globalThis as typeof globalThis & {
    NexusPiper?: {
      synthesize?: (args: { text: string; modelPath: string; configPath: string }) => Promise<string>;
    };
  };
  const native = globalAny.NexusPiper;
  if (!native?.synthesize) return false;

  const configPath = `${model.uri}.json`;
  const wavPath = await native.synthesize({
    text,
    modelPath: model.uri,
    configPath,
  });

  const AudioModule = await import('expo-audio');
  const player = AudioModule.createAudioPlayer(wavPath);
  player.volume = 1;
  player.play();
  return true;
}

export function getPiperVoiceIds(): string[] {
  return OFFLINE_VOICE_MODELS.map((model) => model.id);
}
