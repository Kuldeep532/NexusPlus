export interface AudioEditorToolDefinition {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  order?: number;
}

/** Only child tools with a complete user-facing flow are registered here. */
const AUDIO_EDITOR_TOOLS: AudioEditorToolDefinition[] = [
  { id: 'audio-trimmer', title: 'Audio Trimmer', description: 'Trim audio with exact start/end values and export the selected range.', route: '/audio-editor/audio-trimmer', icon: 'scissors', order: 20 },
  { id: 'audio-compressor', title: 'Audio Compressor', description: 'Reduce file size with bitrate and sample-rate presets, then export a compressed M4A file.', route: '/audio-editor/audio-compressor', icon: 'archive', order: 25 },
  { id: 'mix-audio', title: 'Mix Audio', description: 'Combine multiple audio tracks with native timing, volume and export processing.', route: '/audio-editor/mix-audio', icon: 'layers', order: 30 },
  { id: 'fun-recordings', title: 'Fun Recordings', description: 'Record audio, preview it, choose a dynamic voice profile, and apply the voice effect.', route: '/audio-editor/fun-recordings', icon: 'mic', order: 35 },
  { id: 'voice-changer', title: 'Voice Changer', description: 'Change the voice of an audio file only, using generated profiles or an imported local ONNX model.', route: '/audio-editor/voice-changer', icon: 'mic', order: 37 },
  { id: 'text-to-speech', title: 'Text to Speech', description: 'Select any device-provided language and voice, enter text, and synthesize speech with playback and regeneration controls.', route: '/audio-editor/text-to-speech', icon: 'volume-2', order: 39 },
  { id: 'speed-pitch', title: 'Speed & Pitch', description: 'Change playback speed and pitch independently and export a real processed audio file.', route: '/audio-editor/speed-pitch', icon: 'sliders', order: 39.5 },
  { id: 'audio-effects', title: 'Audio Effects', description: 'Apply synthetic DSP effects such as bass boost, treble, vibrato, echo, telephone, robot, reverb and megaphone.', route: '/audio-editor/audio-effects', icon: 'sliders', order: 39.7 },
  { id: 'audio-to-video', title: 'Audio to Video', description: 'Create an image-based video timeline whose image durations are constrained by the selected audio.', route: '/audio-editor/audio-to-video', icon: 'film', order: 40 },
];

export function getAudioEditorTools(): AudioEditorToolDefinition[] {
  return [...AUDIO_EDITOR_TOOLS].sort((a, b) => (a.order ?? 1000) - (b.order ?? 1000));
}
