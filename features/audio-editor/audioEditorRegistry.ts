export interface AudioEditorToolDefinition {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  order?: number;
}

/**
 * Registry contains only tools that have a real routed implementation.
 * Feature code can exist in the repository without being advertised here
 * until its complete user flow is wired and verified.
 */
const AUDIO_EDITOR_TOOLS: AudioEditorToolDefinition[] = [
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
];

export function getAudioEditorTools(): AudioEditorToolDefinition[] {
  return [...AUDIO_EDITOR_TOOLS].sort((a, b) => (a.order ?? 1000) - (b.order ?? 1000));
}
