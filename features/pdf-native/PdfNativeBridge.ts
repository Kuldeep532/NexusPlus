import { NativeModules, Platform } from 'react-native';

type PdfNativeApi = {
  isAvailable(): Promise<boolean>;
  merge(inputPaths: string[], outputPath: string): Promise<string>;
  imageToPdf(inputPaths: string[], outputPath: string, quality: number): Promise<string>;
  protect(inputPath: string, outputPath: string, password: string): Promise<string>;
  unlock(inputPath: string, outputPath: string, password: string): Promise<string>;
  compress(inputPath: string, outputPath: string, quality: number): Promise<string>;
};

const nativeModule = NativeModules.NexusPdfNative as PdfNativeApi | undefined;

function requireNative(): PdfNativeApi {
  if (!nativeModule) {
    throw new Error(
      `Nexus PDF native module is unavailable on ${Platform.OS}. Install/build the native module before using PDF operations.`,
    );
  }
  return nativeModule;
}

export const PdfNativeBridge = {
  isAvailable: async () => Boolean(nativeModule && (await nativeModule.isAvailable())),
  merge: (inputPaths: string[], outputPath: string) =>
    requireNative().merge(inputPaths, outputPath),
  imageToPdf: (inputPaths: string[], outputPath: string, quality = 90) =>
    requireNative().imageToPdf(inputPaths, outputPath, quality),
  protect: (inputPath: string, outputPath: string, password: string) =>
    requireNative().protect(inputPath, outputPath, password),
  unlock: (inputPath: string, outputPath: string, password: string) =>
    requireNative().unlock(inputPath, outputPath, password),
  compress: (inputPath: string, outputPath: string, quality = 75) =>
    requireNative().compress(inputPath, outputPath, quality),
};
