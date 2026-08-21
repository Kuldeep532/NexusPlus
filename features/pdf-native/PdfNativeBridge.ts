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

async function requireNative(): Promise<PdfNativeApi> {
  if (!nativeModule) {
    throw new Error(`Nexus PDF native module is unavailable on ${Platform.OS}.`);
  }
  try {
    if (!(await nativeModule.isAvailable())) throw new Error('Nexus PDF native module is unavailable in this build.');
  } catch {
    throw new Error('Nexus PDF native module is unavailable in this build.');
  }
  return nativeModule;
}

function validatePath(path: string): void {
  if (!path || path.length > 4096 || /[\u0000\r\n]/.test(path)) throw new Error('Invalid PDF path.');
}

function validatePaths(paths: string[]): void {
  if (!Array.isArray(paths) || paths.length === 0 || paths.length > 100) throw new Error('Invalid PDF input list.');
  paths.forEach(validatePath);
}

export const PdfNativeBridge = {
  isAvailable: async () => {
    if (!nativeModule) return false;
    try { return await nativeModule.isAvailable(); } catch { return false; }
  },
  merge: async (inputPaths: string[], outputPath: string) => {
    validatePaths(inputPaths); validatePath(outputPath); return (await requireNative()).merge(inputPaths, outputPath);
  },
  imageToPdf: async (inputPaths: string[], outputPath: string, quality = 90) => {
    validatePaths(inputPaths); validatePath(outputPath); if (!Number.isFinite(quality)) throw new Error('Invalid image quality.');
    return (await requireNative()).imageToPdf(inputPaths, outputPath, Math.max(1, Math.min(100, Math.round(quality))));
  },
  protect: async (inputPath: string, outputPath: string, password: string) => {
    validatePath(inputPath); validatePath(outputPath); if (password.length < 8) throw new Error('PDF password must be at least 8 characters.');
    return (await requireNative()).protect(inputPath, outputPath, password);
  },
  unlock: async (inputPath: string, outputPath: string, password: string) => {
    validatePath(inputPath); validatePath(outputPath); if (!password) throw new Error('PDF password is required.');
    return (await requireNative()).unlock(inputPath, outputPath, password);
  },
  compress: async (inputPath: string, outputPath: string, quality = 75) => {
    validatePath(inputPath); validatePath(outputPath); if (!Number.isFinite(quality)) throw new Error('Invalid compression quality.');
    return (await requireNative()).compress(inputPath, outputPath, Math.max(1, Math.min(100, Math.round(quality))));
  },
};
