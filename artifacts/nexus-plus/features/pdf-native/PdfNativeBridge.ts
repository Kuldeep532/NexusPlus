declare global {
  var NexusPdfNative?: {
    isAvailable(): boolean;
    merge(inputPaths: string[], outputPath: string): Promise<string>;
    imageToPdf(inputPaths: string[], outputPath: string, quality: number): Promise<string>;
    protect(inputPath: string, outputPath: string, password: string): Promise<string>;
    unlock(inputPath: string, outputPath: string, password: string): Promise<string>;
    compress(inputPath: string, outputPath: string, quality: number): Promise<string>;
  };
}

export const PdfNativeBridge = {
  isAvailable: () => Boolean(globalThis.NexusPdfNative?.isAvailable?.()),
  merge: (inputPaths: string[], outputPath: string) => {
    if (!globalThis.NexusPdfNative) throw new Error('Native PDF engine is unavailable.');
    return globalThis.NexusPdfNative.merge(inputPaths, outputPath);
  },
  imageToPdf: (inputPaths: string[], outputPath: string, quality = 90) => {
    if (!globalThis.NexusPdfNative) throw new Error('Native PDF engine is unavailable.');
    return globalThis.NexusPdfNative.imageToPdf(inputPaths, outputPath, quality);
  },
  protect: (inputPath: string, outputPath: string, password: string) => {
    if (!globalThis.NexusPdfNative) throw new Error('Native PDF engine is unavailable.');
    return globalThis.NexusPdfNative.protect(inputPath, outputPath, password);
  },
  unlock: (inputPath: string, outputPath: string, password: string) => {
    if (!globalThis.NexusPdfNative) throw new Error('Native PDF engine is unavailable.');
    return globalThis.NexusPdfNative.unlock(inputPath, outputPath, password);
  },
  compress: (inputPath: string, outputPath: string, quality = 75) => {
    if (!globalThis.NexusPdfNative) throw new Error('Native PDF engine is unavailable.');
    return globalThis.NexusPdfNative.compress(inputPath, outputPath, quality);
  },
};
