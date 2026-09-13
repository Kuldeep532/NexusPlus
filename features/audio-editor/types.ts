export interface AudioEditorSource {
  id: string;
  uri: string;
  name: string;
  durationMs: number;
  mimeType?: string;
  source: 'document' | 'library';
}

export interface TimelineRangeMs {
  startMs: number;
  endMs: number;
}
