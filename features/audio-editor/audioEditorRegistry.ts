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
  { id: 'remove-silence', title: 'Remove Silence', description: 'Automatically detect sustained quiet gaps and remove them while preserving configurable padding.', route: '/audio-editor/remove-silence', icon: 'volume-x', order: 39.8 },
  { id: 'audio-doctor', title: 'Audio Doctor', description: 'Diagnose common audio damage, reduce noise and hum, soften clipping and generate a repaired copy with evidence-based diagnostics.', route: '/audio-editor/audio-doctor', icon: 'activity', order: 39.9 },
  { id: 'karaoke', title: 'Karaoke', description: 'Upload a karaoke track, sing along, optionally record a high-quality vocal take, and follow timestamped lyrics.', route: '/audio-editor/karaoke', icon: 'mic', order: 39.95 },
  { id: 'voice-over', title: 'Voice Over', description: 'Record a voice track over background audio with professional Podcast, Video, Music and Broadcast presets.', route: '/audio-editor/voice-over', icon: 'mic', order: 39.97 },
  { id: 'remove-audio', title: 'Remove Audio from Video', description: 'Create a copy of a video with its audio tracks removed while leaving the original video unchanged.', route: '/audio-editor/remove-audio', icon: 'volume-x', order: 39.98 },
  { id: 'channel-manipulation', title: 'Channel Manipulation', description: 'Convert, isolate or swap audio channels and export a new processed copy.', route: '/audio-editor/channel-manipulation', icon: 'columns', order: 39.99 },
  { id: 'audio-normalizer', title: 'Audio Normalizer', description: 'Analyze the source peak and create a new copy at a controlled peak level with safety headroom.', route: '/audio-editor/audio-normalizer', icon: 'bar-chart-2', order: 39.995 },
  { id: 'audio-to-video', title: 'Audio to Video', description: 'Create an image-based video timeline whose image durations are constrained by the selected audio.', route: '/audio-editor/audio-to-video', icon: 'film', order: 40 },
];

export function getAudioEditorTools(): AudioEditorToolDefinition[] {
  return [...AUDIO_EDITOR_TOOLS].sort((a, b) => (a.order ?? 1000) - (b.order ?? 1000));
}
