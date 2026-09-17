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

export type ReverbPreset = 'small-room' | 'hall' | 'cave' | 'canyon';
export type ReverbDelaySettings = {
  preset: ReverbPreset;
  amount: number;
  delayMs?: number;
  feedback?: number;
};

export const REVERB_PRESETS: ReadonlyArray<{ id: ReverbPreset; name: string; description: string }> = [
  { id: 'small-room', name: 'Small Room', description: 'Short, tight reflections for a compact space.' },
  { id: 'hall', name: 'Hall', description: 'Longer, spacious reflections with a smooth tail.' },
  { id: 'cave', name: 'Cave', description: 'Dense, dark reflections with a longer decay.' },
  { id: 'canyon', name: 'Canyon', description: 'Wide, long echoes that simulate a large open space.' },
];

export function normalizeAudioEffectSettings(settings: AudioEffectSettings): AudioEffectSettings {
  return { id: settings.id, amount: Math.min(1, Math.max(0, Number.isFinite(settings.amount) ? settings.amount : 0.7)) };
}

export function normalizeReverbDelaySettings(settings: ReverbDelaySettings): ReverbDelaySettings {
  return {
    preset: settings.preset,
    amount: Math.min(1, Math.max(0, Number.isFinite(settings.amount) ? settings.amount : 0.7)),
    delayMs: Math.min(2000, Math.max(1, Number.isFinite(settings.delayMs) ? settings.delayMs! : 140)),
    feedback: Math.min(0.95, Math.max(0, Number.isFinite(settings.feedback) ? settings.feedback! : 0.45)),
  };
}

export async function processAudioEffect(inputPath: string, outputPath: string, settings: AudioEffectSettings): Promise<AudioEffectResult> {
  if (!inputPath) throw new Error('Input audio path is required.');
  if (!outputPath) throw new Error('Output audio path is required.');
  const normalized = normalizeAudioEffectSettings(settings);
  return assertAudioEditorNative().audioEffect(inputPath, outputPath, normalized.id, normalized.amount);
}

export async function processReverbDelay(inputPath: string, outputPath: string, settings: ReverbDelaySettings): Promise<AudioEffectResult> {
  if (!inputPath) throw new Error('Input audio path is required.');
  if (!outputPath) throw new Error('Output audio path is required.');
  const normalized = normalizeReverbDelaySettings(settings);
  return assertAudioEditorNative().audioEffectAdvanced(
    inputPath,
    outputPath,
    'reverb-delay',
    normalized.preset,
    normalized.amount,
    normalized.delayMs!,
    normalized.feedback!,
  );
}
