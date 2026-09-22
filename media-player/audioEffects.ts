export type AudioEffectPreset = 'normal' | 'lofi' | 'echo' | 'stereo-split';

export type AudioEffectSettings = {
  preset: AudioEffectPreset;
  intensity: number;
};

export const AUDIO_EFFECT_PRESETS: Array<{id:AudioEffectPreset;title:string;description:string}> = [
  {id:'normal',title:'Normal',description:'Original playback.'},
  {id:'lofi',title:'Lo-Fi',description:'Soft low-pass character with reduced high-frequency energy.'},
  {id:'echo',title:'Echo',description:'Add a delayed echo effect during playback.'},
  {id:'stereo-split',title:'Stereo Split',description:'Route left and right channel audio independently.'},
];
