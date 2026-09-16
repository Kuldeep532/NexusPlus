export type FunRecordingState = 'idle' | 'recording' | 'recorded';

export type FunRecordingDraft = {
  uri: string;
  durationMs: number;
  profileId: string | null;
};

export function isUsableRecordingUri(uri: string | null | undefined): uri is string {
  return typeof uri === 'string' && uri.trim().length > 0;
}

export function formatRecordingDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
