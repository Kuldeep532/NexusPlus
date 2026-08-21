export type VideoEditorAiFeatureKey =
  | 'auto-captions'
  | 'subtitle-translation'
  | 'smart-cut'
  | 'silence-detection'
  | 'scene-detection'
  | 'face-blur'
  | 'audio-transcription'
  | 'highlight-detection'
  | 'auto-reframe';

export type VideoEditorAiFeature = {
  key: VideoEditorAiFeatureKey;
  title: string;
  description: string;
  model: string;
  mode: 'on-device' | 'native';
  route: string;
};

export const VIDEO_EDITOR_AI_FEATURES: VideoEditorAiFeature[] = [
  {
    key: 'auto-captions',
    title: 'Auto Captions',
    description: 'Generate time-aligned captions from speech offline.',
    model: 'Whisper tiny/base via whisper.cpp',
    mode: 'native',
    route: '/video-editor/ai/auto-captions',
  },
  {
    key: 'subtitle-translation',
    title: 'Subtitle Translation',
    description: 'Translate generated subtitles using a small local model.',
    model: 'Marian/OPUS-MT quantized model',
    mode: 'on-device',
    route: '/video-editor/ai/subtitle-translation',
  },
  {
    key: 'smart-cut',
    title: 'Smart Cut',
    description: 'Suggest filler-word and long-pause cuts from the transcript.',
    model: 'Whisper + deterministic rules',
    mode: 'native',
    route: '/video-editor/ai/smart-cut',
  },
  {
    key: 'silence-detection',
    title: 'AI Silence Detection',
    description: 'Detect speech gaps and recommend tighter edits.',
    model: 'Whisper VAD + audio energy analysis',
    mode: 'native',
    route: '/video-editor/ai/silence-detection',
  },
  {
    key: 'scene-detection',
    title: 'Scene Detection',
    description: 'Find visual cuts and propose automatic clip boundaries.',
    model: 'OpenCV histogram / frame-difference pipeline',
    mode: 'native',
    route: '/video-editor/ai/scene-detection',
  },
  {
    key: 'face-blur',
    title: 'Face Blur',
    description: 'Detect faces and track blur regions locally.',
    model: 'MediaPipe Face Detector',
    mode: 'native',
    route: '/video-editor/ai/face-blur',
  },
  {
    key: 'audio-transcription',
    title: 'Transcript',
    description: 'Create an editable searchable transcript from the video audio.',
    model: 'Whisper tiny/base via whisper.cpp',
    mode: 'native',
    route: '/video-editor/ai/transcript',
  },
  {
    key: 'highlight-detection',
    title: 'Highlight Finder',
    description: 'Score transcript segments for likely highlights without a cloud API.',
    model: 'Whisper + local scoring heuristics',
    mode: 'native',
    route: '/video-editor/ai/highlights',
  },
  {
    key: 'auto-reframe',
    title: 'Auto Reframe',
    description: 'Track a detected face and crop for vertical/social formats.',
    model: 'MediaPipe Face Detector',
    mode: 'native',
    route: '/video-editor/ai/auto-reframe',
  },
];
