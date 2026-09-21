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
    id: 'audio-to-video',
    title: 'Audio to Video',
    description: 'Turn an audio track and timed images into an exported video.',
    route: '/audio-editor/audio-to-video',
    icon: 'film',
    order: 40,
  },
  {
    id: 'audio-effects',
    title: 'Audio Effects',
    description: 'Apply real volume, fade-in, fade-out, and normalization effects to selected audio ranges.',
    route: '/audio-editor/audio-effects',
    icon: 'sliders',
    order: 50,
  },
];

export function getAudioEditorTools(): AudioEditorToolDefinition[] {
  return [...AUDIO_EDITOR_TOOLS].sort((a, b) => (a.order ?? 1000) - (b.order ?? 1000));
}
