export interface AudioEditorToolDefinition {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  order?: number;
}

/**
 * All Audio Editor tools belong to this registry. Do not add child tools to
 * the global Home feature registry; Home should register only the parent
 * Audio Editor feature.
 */
const AUDIO_EDITOR_TOOLS: AudioEditorToolDefinition[] = [
  {
    id: 'add-sound-effects',
    title: 'Add Sound Effects',
    description: 'Add custom sound effects over your audio or between sections with precise timeline and controls.',
    route: '/audio-editor/add-sound-effects',
    icon: 'volume-2',
    order: 10,
  },
];

export function getAudioEditorTools(): AudioEditorToolDefinition[] {
  return [...AUDIO_EDITOR_TOOLS].sort((a, b) => (a.order ?? 1000) - (b.order ?? 1000));
}
