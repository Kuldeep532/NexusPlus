export interface AudioEditorToolDefinition {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  order?: number;
}

/** Only completed child tools are registered here. Home registers the parent Audio Editor. */
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
];

export function getAudioEditorTools(): AudioEditorToolDefinition[] {
  return [...AUDIO_EDITOR_TOOLS].sort((a, b) => (a.order ?? 1000) - (b.order ?? 1000));
}
