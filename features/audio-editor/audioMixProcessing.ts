import { assertAudioEditorNative, type AudioMixInput, type AudioMixResult } from '@/modules/audio-editor-native';
import type { AudioMixProject, AudioMixTrack } from './audioMixTypes';

function validateTrack(track: AudioMixTrack, index: number): void {
  if (!track.source.uri) throw new Error(`Audio track ${index + 1} has no source.`);
  if (!Number.isFinite(track.startMs) || track.startMs < 0) throw new Error(`Audio track ${index + 1} start time is invalid.`);
  if (!Number.isFinite(track.volume) || track.volume < 0 || track.volume > 2) throw new Error(`Audio track ${index + 1} volume must be between 0 and 2.`);
}

/**
 * Mixes any number of tracks by folding native two-input PCM mixes.
 * Processing stays native; the JS/UI layer only orchestrates file paths and timing metadata.
 */
export async function mixAudioProject(project: AudioMixProject, outputPathFactory: (index: number, total: number) => Promise<string>): Promise<AudioMixResult> {
  validateTrack(project.base, 0);
  const activeOverlays = project.overlays.filter((track) => !track.muted);
  activeOverlays.forEach((track, index) => validateTrack(track, index + 1));
  if (activeOverlays.length === 0) throw new Error('Add at least one active audio track to mix.');

  const native = assertAudioEditorNative();
  let currentPath = project.base.source.uri;
  let result: AudioMixResult | null = null;

  for (let index = 0; index < activeOverlays.length; index += 1) {
    const overlay = activeOverlays[index];
    const outputPath = await outputPathFactory(index, activeOverlays.length);
    result = await native.mix({
      inputPath: currentPath,
      overlayPath: overlay.source.uri,
      outputPath,
      overlayStartMs: overlay.startMs,
      overlayVolume: overlay.volume,
    });
    currentPath = result.outputPath;
  }
  return result!;
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
