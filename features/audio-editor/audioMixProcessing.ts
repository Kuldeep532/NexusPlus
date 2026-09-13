import { assertAudioEditorNative, type AudioMixInput, type AudioMixResult } from '@/modules/audio-editor-native';
import type { AudioMixProject, AudioMixTrack } from './audioMixTypes';

function validateTrack(track: AudioMixTrack, index: number): void {
  if (!track.source.uri) throw new Error(`Audio track ${index + 1} has no source.`);
  if (!Number.isFinite(track.startMs) || track.startMs < 0) throw new Error(`Audio track ${index + 1} start time is invalid.`);
  if (!Number.isFinite(track.volume) || track.volume < 0 || track.volume > 2) throw new Error(`Audio track ${index + 1} volume must be between 0 and 2.`);
}

/**
 * Mixes any number of tracks by folding native two-input PCM mixes.
 * The fold is sequential, so the JS/UI layer never decodes PCM or holds sample buffers.
 */
export async function mixAudioProject(project: AudioMixProject): Promise<AudioMixResult> {
  validateTrack(project.base, 0);
  const activeOverlays = project.overlays.filter((track) => !track.muted);
  activeOverlays.forEach((track, index) => validateTrack(track, index + 1));

  const native = assertAudioEditorNative();
  let currentPath = project.base.source.uri;
  let result: AudioMixResult | null = null;

  for (let index = 0; index < activeOverlays.length; index += 1) {
    const overlay = activeOverlays[index];
    const outputPath = index === activeOverlays.length - 1
      ? project.base.source.uri.replace(/\.([^.]+)$/, `-mixed-${Date.now()}.${project.base.source.uri.match(/\.([^.]+)$/)?.[1] ?? 'wav'}`)
      : `${project.base.source.uri}-mix-${Date.now()}-${index}.wav`;

    const input: AudioMixInput = {
      inputPath: currentPath,
      overlayPath: overlay.source.uri,
      overlayStartMs: overlay.startMs,
      overlayVolume: overlay.volume,
      outputPath,
    };
    result = await native.mix(input);
    currentPath = result.outputPath;
  }

  if (!result) {
    throw new Error('Add at least one audio track to mix.');
  }
  return result;
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
