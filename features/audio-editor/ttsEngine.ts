import { File, Directory, Paths } from 'expo-file-system';
import { createAudioPlayer } from 'expo-audio';
import { UNIQUE_VOICE_CATALOG, type VoiceCatalogItem } from '@/features/voice-library/voiceCatalog';
import { getInstalledVoices, type InstalledVoice } from '@/features/voice-library/voiceStore';
import { assertAudioEditorNative } from '@/modules/audio-editor-native';
import * as Speech from 'expo-speech';

export type TtsProvider = 'piper' | 'clone' | 'system';
export type TtsEmotion = 'neutral' | 'happy' | 'sad' | 'laughing' | 'crying' | 'excited' | 'calm' | 'angry';
export type TtsSettings = { speed: number; pitch: number; autoTune: boolean };
export type TtsAnalysis = { emotion: TtsEmotion; speed: number; pitch: number };
export type TtsVoiceOption =
  | { provider: 'piper'; id: string; name: string; language: string; gender: string; quality: string; installed: boolean; modelPath?: string; configPath?: string }
  | { provider: 'clone'; id: string; name: string; language?: string; installed: true; modelPath: string; configPath: string }
  | { provider: 'system'; id: string; name: string; language: string; gender: string; quality: string; installed: true };
export type TtsGenerateResult = { provider: Exclude<TtsProvider, 'system'>; outputUri: string; analysis: TtsAnalysis; voiceId: string };

const TTS_OUTPUT_DIR = new Directory(Paths.document, 'tts-output');

async function localFile(path: string): Promise<File | null> {
  try {
    const file = new File(path);
    return file.exists && file.size > 0 ? file : null;
  } catch { return null; }
}

export async function listTtsVoices(): Promise<TtsVoiceOption[]> {
  const [installed, systemVoices] = await Promise.all([
    getInstalledVoices().catch(() => [] as InstalledVoice[]),
    Speech.getAvailableVoicesAsync().catch(() => []),
  ]);
  const installedMap = new Map(installed.map((voice) => [voice.id, voice]));
  const piper: TtsVoiceOption[] = UNIQUE_VOICE_CATALOG.map((voice: VoiceCatalogItem) => {
    const local = installedMap.get(voice.id);
    return { provider: 'piper', id: voice.id, name: voice.name, language: voice.language, gender: voice.gender, quality: voice.quality, installed: Boolean(local), ...(local ? { modelPath: local.modelPath, configPath: local.configPath } : {}) };
  });
  const clones: TtsVoiceOption[] = installed
    .filter((voice) => voice.canonicalGroupId?.startsWith('clone:'))
    .map((voice) => ({ provider: 'clone' as const, id: voice.id, name: voice.name, language: voice.language, installed: true as const, modelPath: voice.modelPath, configPath: voice.configPath }));
  const system: TtsVoiceOption[] = systemVoices.map((voice) => ({ provider: 'system' as const, id: voice.identifier, name: voice.name || voice.identifier, language: voice.language, gender: String(voice.gender ?? ''), quality: String(voice.quality ?? ''), installed: true as const }));
  return [...piper, ...clones, ...system];
}

export function analyzeTextEmotion(text: string): TtsAnalysis {
  const t = text.trim().toLowerCase();
  const has = (...words: string[]) => words.some((word) => t.includes(word));
  let emotion: TtsEmotion = 'neutral';
  if (has('😂', '🤣', 'haha', 'lol', 'हाहा', 'हंस')) emotion = 'laughing';
  else if (has('😭', 'cry', 'crying', 'रोना', 'रो रहा', 'रो रही')) emotion = 'crying';
  else if (has('😢', 'sad', 'गम', 'उदास', 'दुखी')) emotion = 'sad';
  else if (has('😡', 'angry', 'गुस्सा', 'क्रोधित')) emotion = 'angry';
  else if (has('😍', '😊', 'happy', 'खुश', 'प्रसन्न', 'वाह')) emotion = 'happy';
  else if (has('excited', 'उत्साहित', '🎉')) emotion = 'excited';
  else if (has('calm', 'शांत', 'धीरे')) emotion = 'calm';
  const exclamations = (text.match(/!/g) ?? []).length;
  const questions = (text.match(/\?/g) ?? []).length;
  let speed = 1; let pitch = 1;
  if (emotion === 'excited' || emotion === 'laughing') { speed = 1.08; pitch = 1.06; }
  else if (emotion === 'happy') { speed = 1.02; pitch = 1.03; }
  else if (emotion === 'sad' || emotion === 'crying') { speed = 0.88; pitch = 0.95; }
  else if (emotion === 'angry') { speed = 1.04; pitch = 0.92; }
  else if (emotion === 'calm') { speed = 0.90; pitch = 0.99; }
  speed = Math.min(1.25, Math.max(0.65, speed + (exclamations >= 2 ? 0.03 : 0)));
  pitch = Math.min(1.35, Math.max(0.75, pitch + (questions ? 0.02 : 0)));
  return { emotion, speed, pitch };
}

export async function generateWithNexusTts(text: string, voice: Exclude<TtsVoiceOption, { provider: 'system' }>, settings?: TtsSettings): Promise<TtsGenerateResult> {
  const normalized = text.trim();
  if (!normalized) throw new Error('Enter text before generating speech.');
  if (!voice.modelPath || !voice.configPath) throw new Error('Install the selected Piper or clone voice before generating speech.');
  const analysis = analyzeTextEmotion(normalized);
  const auto = settings?.autoTune !== false;
  const speed = settings?.speed ?? analysis.speed;
  const pitch = settings?.pitch ?? analysis.pitch;
  const chosen: TtsAnalysis = { emotion: auto ? analysis.emotion : 'neutral', speed, pitch };
  const lengthScale = 1 / Math.min(1.5, Math.max(0.65, speed));
  const outputDir = TTS_OUTPUT_DIR;
  outputDir.create({ intermediates: true, idempotent: true });
  const output = new File(outputDir, `nexus-${voice.provider}-${Date.now()}.wav`);
  const native = assertAudioEditorNative();
  const result = await native.synthesizeTts(normalized, voice.modelPath, voice.configPath, output.uri, lengthScale, pitch, chosen.emotion, voice.provider === 'clone');
  const generated = await localFile(result.outputPath);
  if (!generated) throw new Error('Nexus TTS engine did not return a valid audio file.');
  return { provider: voice.provider, outputUri: generated.uri, analysis: chosen, voiceId: voice.id };
}

export async function playGeneratedAudio(uri: string): Promise<() => void> {
  const file = await localFile(uri);
  if (!file) throw new Error('Generated audio file is unavailable.');
  const player = createAudioPlayer(file.uri);
  player.play();
  return () => { try { player.pause(); } finally { player.remove(); } };
}

export async function stopSpeech(): Promise<void> { await Speech.stop(); }
