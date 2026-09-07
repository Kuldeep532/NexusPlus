import { File, Directory, Paths } from 'expo-file-system';
import { OFFLINE_VOICE_MODELS, type OfflineVoiceModel } from './offlineVoiceModels';
import { downloadOfflineVoiceModel, isOfflineVoiceInstalled } from './offlineVoiceManager';

type PiperLanguage = 'en' | 'hi';

const MODEL_DIRECTORY = new Directory(Paths.document, 'tts-models');

function modelForLanguage(language: string): OfflineVoiceModel | undefined {
  const normalized = language.toLowerCase();
  return normalized.startsWith('hi')
    ? OFFLINE_VOICE_MODELS.find((model) => model.id === 'hi-IN-priyamvada-medium')
    : OFFLINE_VOICE_MODELS.find((model) => model.id === 'en-US-lessac-medium');
}

export async function ensurePiperVoice(language: string): Promise<File | null> {
  const model = modelForLanguage(language);
  if (!model) return null;
  if (isOfflineVoiceInstalled(model)) return new File(MODEL_DIRECTORY, model.modelFileName);
  try {
    return await downloadOfflineVoiceModel(model);
  } catch {
    return null;
  }
}

type NexusPiper = {
  synthesize?: (args: { text: string; modelPath: string; configPath: string }) => Promise<string>;
};

function getPiperBridge(): NexusPiper | undefined {
  return (globalThis as typeof globalThis & { NexusPiper?: NexusPiper }).NexusPiper;
}

function existingFile(path: string): File | null {
  if (!path) return null;
  try {
    const file = new File(path);
    return file.exists && file.size > 0 ? file : null;
  } catch {
    return null;
  }
}

/**
 * Native bridge boundary for Piper inference.
 * The native adapter is optional; callers must fall back to system TTS when
 * it is unavailable or when a downloaded asset cannot be used safely.
 */
export async function speakWithPiper(text: string, language: PiperLanguage): Promise<boolean> {
  const normalizedText = text.trim();
  if (!normalizedText) return false;

  try {
    const model = await ensurePiperVoice(language === 'hi' ? 'hi-IN' : 'en-IN');
    const native = getPiperBridge();
    if (!model || !native?.synthesize || !model.exists || model.size <= 0) return false;

    const modelDefinition = modelForLanguage(language === 'hi' ? 'hi-IN' : 'en-IN');
    if (!modelDefinition) return false;
    const config = new File(MODEL_DIRECTORY, modelDefinition.configFileName);
    if (!config.exists || config.size <= 0) return false;

    const wavPath = await native.synthesize({
      text: normalizedText,
      modelPath: model.uri,
      configPath: config.uri,
    });
    if (!wavPath || !existingFile(wavPath)) return false;

    const AudioModule = await import('expo-audio');
    const player = AudioModule.createAudioPlayer(wavPath);
    player.volume = 1;
    player.play();
    return true;
  } catch {
    // Piper is an optional local enhancement; never let it break the caller.
    return false;
  }
}

export function getPiperVoiceIds(): string[] {
  return OFFLINE_VOICE_MODELS.map((model) => model.id);
}
