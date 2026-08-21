import { Platform } from 'react-native';
import type { VocalRemovalOptions, VocalRemovalProgress } from '../../media-player/vocal-remover/types';

type NativeModule = {
  isAvailable(): boolean;
  separate(args: {
    inputPath: string;
    outputPath: string;
    stem: string;
    quality: string;
    preserveBass: boolean;
    preserveStereo: boolean;
    chunkSeconds: number;
  }): Promise<string>;
  cancel(): void;
  dispose(): void;
};

function getNativeModule(): NativeModule | null {
  if (Platform.OS !== 'android') return null;
  return (globalThis as typeof globalThis & { NexusVocalRemoverNative?: NativeModule }).NexusVocalRemoverNative ?? null;
}

function emit(stage: VocalRemovalProgress['stage'], value: number, message: string, callback?: (value: VocalRemovalProgress) => void) {
  callback?.({ stage, progress: value, message });
}

export function isNativeVocalRemoverAvailable(): boolean {
  try { return Boolean(getNativeModule()?.isAvailable?.()); } catch { return false; }
}

export async function separateWithNativeCpp(
  inputPath: string,
  outputPath: string,
  options: VocalRemovalOptions,
  onProgress?: (value: VocalRemovalProgress) => void,
): Promise<{ outputUri: string }> {
  const native = getNativeModule();
  if (!native?.isAvailable?.()) throw new Error('Native C++ vocal-removal engine is unavailable in this development build.');
  emit('preparing', 0.03, 'Preparing native C++ audio pipeline', onProgress);
  const result = await native.separate({
    inputPath,
    outputPath,
    stem: options.outputStem,
    quality: options.quality,
    preserveBass: options.preserveBass,
    preserveStereo: options.preserveStereo,
    chunkSeconds: Math.max(2, options.chunkSeconds ?? 12),
  });
  if (!result) throw new Error('Native C++ vocal-removal engine returned no output path.');
  emit('complete', 1, 'Native C++ vocal separation complete', onProgress);
  return { outputUri: result };
}

export function cancelNativeCppVocalRemoval(): void { getNativeModule()?.cancel?.(); }
export function disposeNativeCppVocalRemoval(): void { getNativeModule()?.dispose?.(); }
