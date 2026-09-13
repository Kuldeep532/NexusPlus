import type { VideoEditorToolKey } from './videoEditorTypes';

export type VideoEditorTool = {
  key: VideoEditorToolKey;
  title: string;
  description: string;
  icon: string;
  route: string;
  nativeRequired?: boolean;
};

export const VIDEO_EDITOR_TOOLS: VideoEditorTool[] = [];
