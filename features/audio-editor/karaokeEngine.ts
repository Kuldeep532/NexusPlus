import { assertAudioEditorNative } from '@/modules/audio-editor-native';
import { createAudioEditorOutputPath } from './audioEditorExport';
import type { KaraokeRecordingResult, KaraokeTrack } from './karaokeTypes';

export async function inspectKaraokeTrack(track: KaraokeTrack): Promise<KaraokeTrack> {
  const metadata = await assertAudioEditorNative().probe(track.uri);
  return { ...track, durationMs: metadata.durationMs, mimeType: metadata.mimeType };
}

export async function createKaraokeOutputPath(name: string): Promise<string> {
  return createAudioEditorOutputPath('Karaoke Recordings', name, 'vocal', 'm4a');
}

/**
 * Native recording is exposed separately so the UI can guarantee that capture
 * begins only after the karaoke playback session has reached its start edge.
 */
export async function startKaraokeRecording(
  karaokeUri: string,
  outputPath: string,
  highQuality: boolean,
  headphoneMode: boolean,
  sampleRate = 48_000,
  channels = 1,
): Promise<void> {
  await assertAudioEditorNative().startKaraokeRecording(
    karaokeUri,
    outputPath,
    highQuality,
    headphoneMode,
    sampleRate,
    channels,
  );
}

export async function stopKaraokeRecording(): Promise<KaraokeRecordingResult> {
  return assertAudioEditorNative().stopKaraokeRecording();
}

export async function cancelKaraokeRecording(): Promise<void> {
  return assertAudioEditorNative().cancelKaraokeRecording();
}
