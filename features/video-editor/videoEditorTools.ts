import type { VideoEditorToolKey } from './videoEditorTypes';

export type VideoEditorTool = {
  key: VideoEditorToolKey;
  title: string;
  description: string;
  icon: string;
  route: string;
  nativeRequired?: boolean;
};

export const VIDEO_EDITOR_TOOLS: VideoEditorTool[] = [
  { key: 'trim', title: 'Trim Video', description: 'Set precise in and out points.', icon: 'content-cut', route: '/video-editor/trim', nativeRequired: true },
  { key: 'split', title: 'Split Clip', description: 'Cut a clip at the playhead.', icon: 'content-cut', route: '/video-editor/split', nativeRequired: true },
  { key: 'merge', title: 'Merge Videos', description: 'Join clips in sequence on one timeline.', icon: 'merge', route: '/video-editor/merge', nativeRequired: true },
  { key: 'silence-remover', title: 'Remove Silence', description: 'Detect quiet sections and create a tighter cut.', icon: 'volume-off', route: '/video-editor/silence-remover', nativeRequired: true },
  { key: 'speed', title: 'Speed', description: 'Slow down or speed up a clip.', icon: 'speedometer', route: '/video-editor/speed', nativeRequired: true },
  { key: 'speed-ramp', title: 'Speed Ramp', description: 'Create smooth variable-speed sections.', icon: 'chart-timeline-variant', route: '/video-editor/speed-ramp', nativeRequired: true },
  { key: 'crop', title: 'Crop & Resize', description: 'Change framing and output aspect ratio.', icon: 'crop', route: '/video-editor/crop', nativeRequired: true },
  { key: 'rotate', title: 'Rotate', description: 'Rotate video in 90° steps.', icon: 'rotate-right', route: '/video-editor/rotate', nativeRequired: true },
  { key: 'flip', title: 'Flip', description: 'Mirror horizontally or vertically.', icon: 'flip-horizontal', route: '/video-editor/flip', nativeRequired: true },
  { key: 'audio', title: 'Audio', description: 'Adjust volume, mute, fade and music.', icon: 'music-note', route: '/video-editor/audio' },
  { key: 'equalizer', title: 'Equalizer', description: 'Shape low, mid and high frequencies.', icon: 'tune-variant', route: '/video-editor/equalizer', nativeRequired: true },
  { key: 'loudness', title: 'Loudness', description: 'Normalize output toward a target LUFS level.', icon: 'volume-high', route: '/video-editor/loudness', nativeRequired: true },
  { key: 'denoise', title: 'Audio Denoise', description: 'Reduce steady background noise locally.', icon: 'waveform', route: '/video-editor/denoise', nativeRequired: true },
  { key: 'text', title: 'Text & Captions', description: 'Add titles, captions and callouts.', icon: 'format-text', route: '/video-editor/text' },
  { key: 'subtitles', title: 'Subtitles', description: 'Import, edit and style subtitle tracks.', icon: 'subtitles', route: '/video-editor/subtitles' },
  { key: 'filters', title: 'Filters', description: 'Apply visual looks without destructive UI state.', icon: 'palette', route: '/video-editor/filters' },
  { key: 'adjust', title: 'Adjust', description: 'Tune brightness, contrast, saturation and more.', icon: 'tune', route: '/video-editor/adjust', nativeRequired: true },
  { key: 'watermark', title: 'Watermark', description: 'Overlay a logo or text watermark.', icon: 'watermark', route: '/video-editor/watermark', nativeRequired: true },
  { key: 'overlay', title: 'Overlay', description: 'Place a second video, image or sticker over the clip.', icon: 'layers-plus', route: '/video-editor/overlay', nativeRequired: true },
  { key: 'transitions', title: 'Transitions', description: 'Add fades, wipes and smooth clip-to-clip transitions.', icon: 'transition', route: '/video-editor/transitions', nativeRequired: true },
  { key: 'keyframes', title: 'Keyframes', description: 'Animate position, scale, rotation and opacity.', icon: 'timeline-edit', route: '/video-editor/keyframes', nativeRequired: true },
  { key: 'chroma-key', title: 'Chroma Key', description: 'Remove a selected color for green-screen compositing.', icon: 'image-filter-center-focus', route: '/video-editor/chroma-key', nativeRequired: true },
  { key: 'freeze-frame', title: 'Freeze Frame', description: 'Hold a selected frame for a chosen duration.', icon: 'pause-circle', route: '/video-editor/freeze-frame', nativeRequired: true },
  { key: 'reverse', title: 'Reverse', description: 'Play a selected clip backwards.', icon: 'rewind', route: '/video-editor/reverse', nativeRequired: true },
  { key: 'stabilize', title: 'Stabilize', description: 'Reduce camera shake with a native stabilization pass.', icon: 'image-filter-center-focus-weak', route: '/video-editor/stabilize', nativeRequired: true },
  { key: 'extract-audio', title: 'Extract Audio', description: 'Export the audio track from a video.', icon: 'file-music', route: '/video-editor/extract-audio', nativeRequired: true },
  { key: 'letterbox', title: 'Social Canvas', description: 'Fit video into 9:16, 1:1, 4:5 or 16:9 canvases.', icon: 'aspect-ratio', route: '/video-editor/letterbox', nativeRequired: true },
  { key: 'voiceover', title: 'Voiceover', description: 'Record or attach narration to the timeline.', icon: 'microphone', route: '/video-editor/voiceover' },
];
