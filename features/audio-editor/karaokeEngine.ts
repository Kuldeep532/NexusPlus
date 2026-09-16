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

export async function startKaraokeRecording(
  karaokeUri: string,
  outputPath: string,
  highQuality: boolean,
  headphoneMode: boolean,
  sampleRate = 48_000,
  channels = 1,
): Promise<void> {
  await assertAudioEditorNative().startKaraokeRecording(karaokeUri, outputPath, highQuality, headphoneMode, sampleRate, channels);
}

export async function pauseKaraokeRecording(): Promise<void> {
  await assertAudioEditorNative().pauseKaraokeRecording();
}

export async function resumeKaraokeRecording(): Promise<void> {
  await assertAudioEditorNative().resumeKaraokeRecording();
}

export async function stopKaraokeRecording(): Promise<KaraokeRecordingResult> {
  return assertAudioEditorNative().stopKaraokeRecording();
}

export async function cancelKaraokeRecording(): Promise<void> {
  return assertAudioEditorNative().cancelKaraokeRecording();
}
