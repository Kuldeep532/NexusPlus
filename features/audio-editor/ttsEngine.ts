import { File, Directory, Paths } from 'expo-file-system';
import { createAudioPlayer } from 'expo-audio';
import { UNIQUE_VOICE_CATALOG, type VoiceCatalogItem } from '@/features/voice-library/voiceCatalog';
import { getInstalledVoices, type InstalledVoice } from '@/features/voice-library/voiceStore';
import * as Speech from 'expo-speech';
import { AudioEditorNative } from '@/features/audio-editor/audioEditorNative';

export type TtsProvider = 'piper' | 'clone' | 'system' | 'elevenlabs';
export type TtsEmotion = 'neutral' | 'happy' | 'sad' | 'laughing' | 'crying' | 'excited' | 'calm' | 'angry';
export type TtsSettings = { speed: number; pitch: number; autoTune: boolean };
export type TtsAnalysis = { emotion: TtsEmotion; speed: number; pitch: number };
export type CloneVoice = { id: string; name: string; language?: string; modelPath: string; configPath: string };
export type TtsVoiceOption =
  | { provider: 'piper'; id: string; name: string; language: string; gender: string; quality: string; installed: boolean; modelPath?: string; configPath?: string }
  | { provider: 'clone'; id: string; name: string; language?: string; installed: true; modelPath: string; configPath: string };
export type TtsGenerateResult = { provider: Exclude<TtsProvider, 'system'>; outputUri: string; analysis: TtsAnalysis; voiceId: string };

type NexusPiperBridge = {
  synthesize?: (args: { text: string; modelPath: string; configPath: string; lengthScale?: number; pitchScale?: number; emotion?: string; clone?: boolean }) => Promise<string>;
  synthesizeClone?: (args: { text: string; modelPath: string; configPath: string; lengthScale?: number; pitchScale?: number; emotion?: string }) => Promise<string>;
};
const PIPER_OUTPUT_DIR = new Directory(Paths.document, 'tts-output');
function bridge(): NexusPiperBridge | undefined { return (globalThis as typeof globalThis & { NexusPiper?: NexusPiperBridge }).NexusPiper; }
function safeFile(path: string): File | null { try { const file = new File(path); return file.exists && file.size > 0 ? file : null; } catch { return null; } }

export async function listTtsVoices(): Promise<TtsVoiceOption[]> {
  const [installed, systemVoices] = await Promise.all([getInstalledVoices().catch(() => [] as InstalledVoice[]), Speech.getAvailableVoicesAsync().catch(() => [])]);
  const installedMap = new Map(installed.map((voice) => [voice.id, voice]));
  const piper: TtsVoiceOption[] = UNIQUE_VOICE_CATALOG.map((voice: VoiceCatalogItem) => { const local = installedMap.get(voice.id); return { provider: 'piper', id: voice.id, name: voice.name, language: voice.language, gender: voice.gender, quality: voice.quality, installed: Boolean(local), ...(local ? { modelPath: local.modelPath, configPath: local.configPath } : {}) }; });
  const clones: TtsVoiceOption[] = installed.filter((voice) => voice.canonicalGroupId?.startsWith('clone:')).map((voice) => ({ provider: 'clone' as const, id: voice.id, name: voice.name, language: voice.language, installed: true as const, modelPath: voice.modelPath, configPath: voice.configPath }));
  const uniqueSystem = systemVoices.map((voice) => ({ provider: 'system' as const, id: voice.identifier, name: voice.name || voice.identifier, language: voice.language, gender: String(voice.gender ?? ''), quality: String(voice.quality ?? ''), installed: true } as const));
  return [...piper, ...clones, ...uniqueSystem];
}

export function analyzeTextEmotion(text: string): TtsAnalysis {
  const normalized = text.trim().toLowerCase(); const has = (...tokens: string[]) => tokens.some((token) => normalized.includes(token)); let emotion: TtsEmotion = 'neutral';
  if (has('😂', '🤣', 'haha', 'lol', 'हाहा', 'हंस')) emotion = 'laughing'; else if (has('😭', '😢', 'cry', 'crying', 'रोना', 'रो रहा', 'दुख')) emotion = 'crying'; else if (has('sad', 'गम', 'उदास', 'दुखी')) emotion = 'sad'; else if (has('😡', 'angry', 'गुस्सा', 'क्रोधित')) emotion = 'angry'; else if (has('😍', '😊', 'happy', 'खुश', 'प्रसन्न', 'वाह')) emotion = 'happy'; else if (has('excited', 'उत्साहित', '!!!', '🎉')) emotion = 'excited'; else if (has('calm', 'शांत', 'धीरे')) emotion = 'calm';
  let speed = 1, pitch = 1; if (emotion === 'excited' || emotion === 'laughing') { speed = 1.08; pitch = 1.06; } if (emotion === 'happy') { speed = 1.02; pitch = 1.03; } if (emotion === 'sad' || emotion === 'crying') { speed = 0.88; pitch = 0.95; } if (emotion === 'angry') { speed = 1.04; pitch = 0.92; } if (emotion === 'calm') { speed = 0.90; pitch = 0.99; }
  if ((text.match(/!/g) ?? []).length >= 2) speed += 0.03; if ((text.match(/\?/g) ?? []).length >= 1) pitch += 0.02; return { emotion, speed: Math.min(1.25, Math.max(0.65, speed)), pitch: Math.min(1.35, Math.max(0.75, pitch)) };
}

async function synthesizeViaNative(text: string, voice: Extract<TtsVoiceOption, { provider: 'piper' | 'clone' }>, chosen: TtsAnalysis): Promise<string | null> {
  if (!AudioEditorNative?.synthesizePiper || !voice.modelPath || !voice.configPath) return null;
  const result = await AudioEditorNative.synthesizePiper({ text, modelPath: voice.modelPath, configPath: voice.configPath, lengthScale: 1 / Math.max(0.65, Math.min(1.5, chosen.speed)), pitchScale: chosen.pitch, emotion: chosen.emotion, clone: voice.provider === 'clone' });
  return safeFile(result.outputPath)?.uri ?? null;
}

export async function generateWithPiper(text: string, voice: Extract<TtsVoiceOption, { provider: 'piper' | 'clone' }>, settings?: TtsSettings): Promise<TtsGenerateResult> {
  const normalized = text.trim(); if (!normalized) throw new Error('Enter text before generating speech.');
  if (!('modelPath' in voice) || !voice.modelPath || !voice.configPath) throw new Error('The selected voice is not installed locally. Install the voice model first.');
  const analysis = analyzeTextEmotion(normalized);
  const chosen = settings?.autoTune === false ? { emotion: 'neutral' as TtsEmotion, speed: settings.speed, pitch: settings.pitch } : { emotion: analysis.emotion, speed: settings?.speed ?? analysis.speed, pitch: settings?.pitch ?? analysis.pitch };
  let wavUri = await synthesizeViaNative(normalized, voice, chosen);
  if (!wavUri) {
    const native = bridge(); if (!native) throw new Error('Nexus Plus Piper/ONNX engine is not loaded in this Android build.');
    const synth = voice.provider === 'clone' ? native.synthesizeClone : native.synthesize; if (!synth) throw new Error(`Nexus Plus ${voice.provider === 'clone' ? 'clone voice' : 'Piper'} synthesis backend is not available in this build.`);
    const wavPath = await synth({ text: normalized, modelPath: voice.modelPath, configPath: voice.configPath, lengthScale: 1 / Math.max(0.65, Math.min(1.5, chosen.speed)), pitchScale: chosen.pitch, emotion: chosen.emotion });
    wavUri = safeFile(wavPath)?.uri ?? null;
  }
  if (!wavUri) throw new Error('The local TTS engine returned no valid audio file.');
  PIPER_OUTPUT_DIR.create({ intermediates: true, idempotent: true });
  const output = new File(PIPER_OUTPUT_DIR, `nexus-${voice.provider}-${Date.now()}.wav`); const generated = new File(wavUri); if (generated.uri !== output.uri) generated.copy(output);
  return { provider: voice.provider, outputUri: output.uri, analysis: chosen, voiceId: voice.id };
}

export async function playGeneratedAudio(uri: string): Promise<() => void> { const file = safeFile(uri); if (!file) throw new Error('Generated audio file is unavailable.'); const player = createAudioPlayer(file.uri); player.play(); return () => { try { player.pause(); } finally { player.remove(); } }; }
export async function stopSpeech(): Promise<void> { await Speech.stop(); }
