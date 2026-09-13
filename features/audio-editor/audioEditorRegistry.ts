export interface AudioEditorToolDefinition {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  order?: number;
}

/** All child Audio Editor tools belong here. Home registers only the parent editor. */
const AUDIO_EDITOR_TOOLS: AudioEditorToolDefinition[] = [
  {
    id: 'add-sound-effects',
    title: 'Add Sound Effects',
    description: 'Add sound effects over your audio or between sections with precise timeline controls.',
    route: '/audio-editor/add-sound-effects',
    icon: 'volume-2',
    order: 10,
  },
  {
    id: 'audio-trimmer',
    title: 'Audio Trimmer',
    description: 'Trim audio manually or use smart ringtone cut suggestions based on detected audio patterns.',
    route: '/audio-editor/audio-trimmer',
    icon: 'scissors',
    order: 20,
  },
];

export function getAudioEditorTools(): AudioEditorToolDefinition[] {
  return [...AUDIO_EDITOR_TOOLS].sort((a, b) => (a.order ?? 1000) - (b.order ?? 1000));
}
