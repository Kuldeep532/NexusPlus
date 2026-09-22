export interface AudioEditorToolDefinition {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  order?: number;
}

/**
 * Registry contains only audio-editor tools with a routed, implemented flow.
 * Feature code is not advertised here until its user flow is wired and verified.
 */
const AUDIO_EDITOR_TOOLS: AudioEditorToolDefinition[] = [
  {
    id: 'audio-compressor',
    title: 'Audio Compressor',
    description: 'Reduce audio file size with real native AAC bitrate and sample-rate presets.',
    route: '/audio-editor/audio-compressor',
    icon: 'minimize-2',
    order: 10,
  },
  {
    id: 'audio-trimmer',
    title: 'Audio Trimmer',
    description: 'Trim audio with exact start/end values and export the selected range.',
    route: '/audio-editor/audio-trimmer',
    icon: 'scissors',
    order: 20,
  },
  {
    id: 'mix-audio',
    title: 'Mix Audio',
    description: 'Combine multiple audio tracks with native timing, volume and export processing.',
    route: '/audio-editor/mix-audio',
    icon: 'layers',
    order: 30,
  },
  {
    id: 'audio-effects',
    title: 'Audio Effects',
    description: 'Apply real volume, fade-in, fade-out, and normalization effects to selected audio ranges.',
    route: '/audio-editor/audio-effects',
    icon: 'sliders',
    order: 50,
  },
  {
    id: 'audio-normalizer',
    title: 'Audio Normalizer',
    description: 'Analyze the source peak and create a new copy at a controlled peak level with safety headroom.',
    route: '/audio-editor/audio-normalizer',
    icon: 'bar-chart-2',
    order: 55,
  },
  {
    id: 'speed-pitch',
    title: 'Speed & Pitch',
    description: 'Change playback speed and pitch independently and export a real processed audio file.',
    route: '/audio-editor/speed-pitch',
    icon: 'sliders',
    order: 57,
  },
  {
    id: 'remove-silence',
    title: 'Remove Silence',
    description: 'Automatically detect sustained quiet gaps and remove them while preserving configurable padding.',
    route: '/audio-editor/remove-silence',
    icon: 'volume-x',
    order: 58,
  },
  {
    id: 'text-to-speech',
    title: 'Text to Speech',
    description: 'Generate speech with installed Nexus voices, speed, pitch, and automatic emotion tuning.',
    route: '/audio-editor/text-to-speech',
    icon: 'volume-2',
    order: 60,
  },
];

export function getAudioEditorTools(): AudioEditorToolDefinition[] {
  return [...AUDIO_EDITOR_TOOLS].sort((a, b) => (a.order ?? 1000) - (b.order ?? 1000));
}
