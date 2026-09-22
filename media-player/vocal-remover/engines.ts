import { AudioEditorNative } from '@/modules/audio-editor-native';
import type { VocalRemovalEngine, VocalRemovalOptions, VocalRemovalProgress } from './types';

/**
 * Bridge to a native/on-device AI implementation.
 *
 * The bridge is intentionally tiny so the UI and job manager never depend on
 * a particular ML runtime. A development build can expose
 * globalThis.NexusVocalRemover with the methods below, backed by ONNX Runtime,
 * TFLite, or another native inference engine.
 */
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
  readonly displayName = 'Nexus AI Vocal Separation';

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
    const bridge = getNativeBridge();
    if (!bridge?.separate) throw new Error('Android vocal-removal engine is not installed in this build.');
    const outputUri = outputPath(inputUri, options.outputStem, options.quality);
    onProgress?.({ stage: 'preparing', progress: 0.05, message: 'Preparing legacy native vocal separation' });
    return bridge.separate(inputUri, outputUri, options, onProgress ?? (() => undefined));
  }

  async cancel(): Promise<void> {
    await getNativeBridge()?.cancel?.();
  }

  async dispose(): Promise<void> {
    await getNativeBridge()?.dispose?.();
  }
}

/**
 * Fast fallback for stereo mixes where vocals are strongly center-panned.
 * This is deliberately separate from the AI engine and can be replaced later.
 */
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
