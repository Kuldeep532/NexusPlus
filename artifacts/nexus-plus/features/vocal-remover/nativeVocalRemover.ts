import { Platform } from 'react-native';
import type { VocalRemovalOptions, VocalRemovalProgress } from '../../media-player/vocal-remover/types';

type NativeModule = {
  isAvailable(): boolean;
  separate(inputPath: string, outputPath: string, stem: string, quality: string, preserveBass: boolean, preserveStereo: boolean, chunkSeconds: number): string;
  cancel(): void;
  dispose(): void;
};

function getNativeModule(): NativeModule | null {
  if (Platform.OS !== 'android') return null;
  try {
    // The Android-native C++ engine is exposed by the generated development build.
    // Keep this require isolated so Expo Go/web builds do not load native-only code.
    return require('../../android/app/src/main/java/com/nexuswavetech/nexusplus/VocalRemoverNative').VocalRemoverNative as NativeModule;
  } catch {
    return null;
  }
}

function progress(stage: VocalRemovalProgress['stage'], value: number, message: string, callback?: (value: VocalRemovalProgress) => void) {
  callback?.({ stage, progress: value, message });
}

export function isNativeVocalRemoverAvailable(): boolean {
  try {
    return Boolean(getNativeModule()?.isAvailable?.());
  } catch {
    return false;
  }
}

export async function separateWithNativeCpp(
  inputPath: string,
  outputPath: string,
  options: VocalRemovalOptions,
  onProgress?: (value: VocalRemovalProgress) => void,
): Promise<{ outputUri: string }> {
  const native = getNativeModule();
  if (!native?.isAvailable?.()) {
    throw new Error('Native C++ vocal-removal engine is unavailable in this build.');
  }

  progress('preparing', 0.03, 'Preparing native C++ audio pipeline', onProgress);
  const result = native.separate(
    inputPath,
    outputPath,
    options.outputStem,
    options.quality,
    options.preserveBass,
    options.preserveStereo,
    Math.max(2, options.chunkSeconds ?? 12),
  );

  if (!result || result === outputPath) {
    progress('complete', 1, 'Native C++ vocal separation complete', onProgress);
    return { outputUri: outputPath };
  }

  progress('error', 1, result, onProgress);
  throw new Error(result);
}

export function cancelNativeCppVocalRemoval(): void {
  getNativeModule()?.cancel?.();
}

export function disposeNativeCppVocalRemoval(): void {
  getNativeModule()?.dispose?.();
}
