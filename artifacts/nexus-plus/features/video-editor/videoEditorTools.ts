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
  { key: 'trim', title: 'Trim Video', description: 'Set precise in and out points.', icon: 'content-cut', route: '/video-editor/trim' },
  { key: 'split', title: 'Split Clip', description: 'Cut a clip at the playhead.', icon: 'content-cut', route: '/video-editor/split' },
  { key: 'merge', title: 'Merge Videos', description: 'Join clips in sequence on one timeline.', icon: 'merge', route: '/video-editor/merge' },
  { key: 'silence-remover', title: 'Remove Silence', description: 'Detect quiet sections and create a tighter cut.', icon: 'volume-off', route: '/video-editor/silence-remover', nativeRequired: true },
  { key: 'speed', title: 'Speed', description: 'Slow down or speed up a clip.', icon: 'speedometer', route: '/video-editor/speed' },
  { key: 'crop', title: 'Crop & Resize', description: 'Change framing and output aspect ratio.', icon: 'crop', route: '/video-editor/crop' },
  { key: 'rotate', title: 'Rotate', description: 'Rotate video in 90° steps.', icon: 'rotate-right', route: '/video-editor/rotate' },
  { key: 'flip', title: 'Flip', description: 'Mirror horizontally or vertically.', icon: 'flip-horizontal', route: '/video-editor/flip' },
  { key: 'audio', title: 'Audio', description: 'Adjust volume, mute, fade and music.', icon: 'music-note', route: '/video-editor/audio' },
  { key: 'text', title: 'Text & Captions', description: 'Add titles, captions and callouts.', icon: 'format-text', route: '/video-editor/text' },
  { key: 'subtitles', title: 'Subtitles', description: 'Import, edit and style subtitle tracks.', icon: 'subtitles', route: '/video-editor/subtitles' },
  { key: 'filters', title: 'Filters', description: 'Apply visual looks without destructive UI state.', icon: 'palette', route: '/video-editor/filters' },
  { key: 'adjust', title: 'Adjust', description: 'Tune brightness, contrast, saturation and more.', icon: 'tune', route: '/video-editor/adjust' },
  { key: 'watermark', title: 'Watermark', description: 'Overlay a logo or text watermark.', icon: 'watermark', route: '/video-editor/watermark' },
  { key: 'freeze-frame', title: 'Freeze Frame', description: 'Hold a selected frame for a chosen duration.', icon: 'pause-circle', route: '/video-editor/freeze-frame' },
  { key: 'reverse', title: 'Reverse', description: 'Play a selected clip backwards.', icon: 'rewind', route: '/video-editor/reverse' },
  { key: 'extract-audio', title: 'Extract Audio', description: 'Export the audio track from a video.', icon: 'file-music', route: '/video-editor/extract-audio' },
  { key: 'voiceover', title: 'Voiceover', description: 'Record or attach narration to the timeline.', icon: 'microphone', route: '/video-editor/voiceover' },
];
