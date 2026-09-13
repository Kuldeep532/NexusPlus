import { assertAudioEditorNative, type AudioMixInput, type AudioMixResult } from '@/modules/audio-editor-native';
import type { AudioMixProject, AudioMixTrack } from './audioMixTypes';

function validateTrack(track: AudioMixTrack, index: number): void {
  if (!track.source.uri) throw new Error(`Audio track ${index + 1} has no source.`);
  if (!Number.isFinite(track.startMs) || track.startMs < 0) throw new Error(`Audio track ${index + 1} start time is invalid.`);
  if (!Number.isFinite(track.volume) || track.volume < 0 || track.volume > 2) {
    throw new Error(`Audio track ${index + 1} volume must be between 0 and 2.`);
  }
}

/** Mix all active overlays in one native pass so JS only manages metadata and remains responsive. */
export async function mixAudioProject(project: AudioMixProject, outputPath: string): Promise<AudioMixResult> {
  validateTrack(project.base, 0);
  const overlays = project.overlays.filter((track) => !track.muted);
  overlays.forEach((track, index) => validateTrack(track, index + 1));
  if (overlays.length === 0) throw new Error('Add at least one active audio track to mix.');
  if (!outputPath) throw new Error('A mix output path is required.');

  return assertAudioEditorNative().mixProject({
    basePath: project.base.source.uri,
    overlays: overlays.map((track) => ({
      path: track.source.uri,
      startMs: track.startMs,
      volume: track.volume,
    })),
    outputPath,
  });
}

export async function mixAudio(input: AudioMixInput): Promise<AudioMixResult> {
  if (!input.inputPath || !input.overlayPath || !input.outputPath) {
    throw new Error('Base audio, overlay audio, and output path are required.');
  }
  if (!Number.isFinite(input.overlayStartMs) || input.overlayStartMs < 0) {
    throw new Error('Overlay start time must be a non-negative number.');
  }
  if (!Number.isFinite(input.overlayVolume) || input.overlayVolume < 0 || input.overlayVolume > 2) {
    throw new Error('Overlay volume must be between 0 and 2.');
  }
  return assertAudioEditorNative().mix(input);
}
