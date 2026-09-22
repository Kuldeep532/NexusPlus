import { AudioEditorNative } from '@/modules/audio-editor-native';
import type { VocalRemovalEngine, VocalRemovalOptions, VocalRemovalProgress } from './types';

/** Native Android vocal-removal bridge. */
type NativeBridge = {
  isAvailable?: () => Promise<boolean>;
  separate?: (
    inputUri: string,
    outputUri: string,
    options: VocalRemovalOptions,
    onProgress: (progress: VocalRemovalProgress) => void,
  ) => Promise<{ outputUri: string; durationMs?: number }>;
  cancel?: () => Promise<void>;
  dispose?: () => Promise<void>;
};

function getNativeBridge(): NativeBridge | undefined {
  return (globalThis as typeof globalThis & { NexusVocalRemover?: NativeBridge }).NexusVocalRemover;
}

function outputPath(inputUri: string, stem: string, quality: string): string {
  const separator = inputUri.includes('?') ? '&' : '?';
  return `${inputUri}${separator}nexus_vocal_stem=${stem}&nexus_vocal_quality=${quality}`;
}

export class NativeAiVocalRemovalEngine implements VocalRemovalEngine {
  readonly id = 'native-ai' as const;
  readonly displayName = 'Nexus Android Vocal Separation';

  async isAvailable(): Promise<boolean> {
    if (AudioEditorNative?.vocalRemove) return true;
    const bridge = getNativeBridge();
    return Boolean(bridge?.separate && (await bridge.isAvailable?.() ?? true));
  }

  async separate(inputUri: string, options: VocalRemovalOptions, onProgress?: (p: VocalRemovalProgress) => void) {
    if (AudioEditorNative?.vocalRemove) {
      onProgress?.({ stage: 'preparing', progress: 0.03, message: 'Preparing Android audio decoder' });
      const outputUri = inputUri + '.nexus-vocal-' + Date.now() + '.wav';
      const result = await AudioEditorNative.vocalRemove(
        inputUri,
        outputUri,
        options.outputStem,
        options.quality,
        options.preserveBass,
        options.preserveStereo,
      );
      onProgress?.({ stage: 'separating', progress: 0.8, message: 'Applying native center-channel separation' });
      onProgress?.({ stage: 'complete', progress: 1, message: 'Vocal separation complete' });
      return { outputUri: result.outputPath, durationMs: result.durationMs };
    }
    throw new Error('Android Audio Editor native vocal-removal module is unavailable. Rebuild the Android app.');
  }

  async cancel(): Promise<void> {
    await getNativeBridge()?.cancel?.();
  }

  async dispose(): Promise<void> {
    await getNativeBridge()?.dispose?.();
  }
}

/** Disabled compatibility engine; it previously returned a URI without processing audio. */
export class PhaseCancelVocalRemovalEngine implements VocalRemovalEngine {
  readonly id = 'phase-cancel' as const;
  readonly displayName = 'Stereo Center-Channel Removal';

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async separate(): Promise<{ outputUri: string }> {
    throw new Error('The compatibility phase-cancel engine is disabled because it previously returned a URI without processing audio.');
  }

  async cancel(): Promise<void> {}
  async dispose(): Promise<void> {}
}

export function createVocalRemovalEngines(): VocalRemovalEngine[] {
  return [new NativeAiVocalRemovalEngine(), new PhaseCancelVocalRemovalEngine()];
}
