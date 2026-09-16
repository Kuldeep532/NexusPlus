export type KaraokeLyricsLine = {
  startMs: number;
  endMs?: number;
  text: string;
};

export type KaraokeTrack = {
  uri: string;
  name: string;
  durationMs: number;
  mimeType?: string | null;
  lyrics?: KaraokeLyricsLine[];
};

export type KaraokeRecordingMode = 'listen-only' | 'record-vocal';

export type KaraokeRecordingOptions = {
  mode: KaraokeRecordingMode;
  karaokeUri: string;
  outputPath?: string;
  highQuality: boolean;
  headphoneMode: boolean;
  sampleRate?: number;
  channels?: number;
};

export type KaraokeRecordingResult = {
  outputPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  mimeType: string;
  recordingStartedWithTrack: boolean;
  headphoneModeApplied: boolean;
  processing: string[];
};
