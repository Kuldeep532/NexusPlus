export type SoundEffectCategory = 'transition' | 'impact' | 'ambient' | 'utility';

export type SoundEffectPreset = {
  id: string;
  title: string;
  category: SoundEffectCategory;
  description: string;
};

/** Metadata only: presets become selectable once backed by real audio assets. */
export const SOUND_EFFECT_PRESETS: SoundEffectPreset[] = [
  { id: 'whoosh', title: 'Whoosh', category: 'transition', description: 'Short transition sweep.' },
  { id: 'hit', title: 'Impact', category: 'impact', description: 'Short impact accent.' },
  { id: 'click', title: 'Click', category: 'utility', description: 'Clean interface click.' },
  { id: 'rise', title: 'Rise', category: 'transition', description: 'Build-up accent for transitions.' },
  { id: 'ambient', title: 'Ambient', category: 'ambient', description: 'Low-intensity background texture.' },
];

export function getSoundEffectPreset(id: string): SoundEffectPreset | undefined {
  return SOUND_EFFECT_PRESETS.find((preset) => preset.id === id);
}
