import { assertAudioEditorNative } from '@/modules/audio-editor-native';

export type AudioEffectId = 'bass-boost' | 'treble' | 'vibrato' | 'echo' | 'telephone' | 'robot' | 'reverb' | 'megaphone';
export type AudioEffectSettings = { id: AudioEffectId; amount: number };
export type AudioEffectResult = { outputPath: string; durationMs: number; sampleRate: number; channels: number; mimeType: string | null };

export const AUDIO_EFFECTS: ReadonlyArray<{ id: AudioEffectId; name: string; description: string }> = [
  { id: 'bass-boost', name: 'Bass Boost', description: 'Strengthen low frequencies.' },
  { id: 'treble', name: 'Treble', description: 'Increase high-frequency detail.' },
  { id: 'vibrato', name: 'Vibrato', description: 'Add periodic pitch modulation.' },
  { id: 'echo', name: 'Echo', description: 'Add a timed repeating echo.' },
  { id: 'telephone', name: 'Telephone', description: 'Band-limit the audio for a telephone sound.' },
  { id: 'robot', name: 'Robot', description: 'Add synthesized ring-modulation character.' },
  { id: 'reverb', name: 'Reverb', description: 'Add a short synthetic room response.' },
  { id: 'megaphone', name: 'Megaphone', description: 'Add band limiting and mild saturation.' },
];

export function normalizeAudioEffectSettings(settings: AudioEffectSettings): AudioEffectSettings {
  return { id: settings.id, amount: Math.min(1, Math.max(0, Number.isFinite(settings.amount) ? settings.amount : 0.7)) };
}

export async function processAudioEffect(inputPath: string, outputPath: string, settings: AudioEffectSettings): Promise<AudioEffectResult> {
  if (!inputPath) throw new Error('Input audio path is required.');
  if (!outputPath) throw new Error('Output audio path is required.');
  const normalized = normalizeAudioEffectSettings(settings);
  return assertAudioEditorNative().audioEffect(inputPath, outputPath, normalized.id, normalized.amount);
}
