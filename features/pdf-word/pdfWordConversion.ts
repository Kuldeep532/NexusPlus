import { NativeModules, Platform } from 'react-native';

type PdfWordApi = {
  pdfToWord(inputPath: string, outputPath: string): Promise<string>;
  wordToPdf(inputPath: string, outputPath: string): Promise<string>;
};

const nativeModule = NativeModules.NexusPdfNative as Partial<PdfWordApi> | undefined;

function validatePath(path: string): void {
  if (!path || path.length > 4096 || /[\u0000\r\n]/.test(path)) throw new Error('Invalid document path.');
}

function requireNativeMethod<K extends keyof PdfWordApi>(method: K): NonNullable<PdfWordApi[K]> {
  const fn = nativeModule?.[method];
  if (!fn || typeof fn !== 'function') {
    throw new Error(`PDF ⇄ Word conversion is not available in the current ${Platform.OS} native build.`);
  }
  return fn as NonNullable<PdfWordApi[K]>;
}

export async function convertPdfToWord(inputPath: string, outputPath: string): Promise<string> {
  validatePath(inputPath);
  validatePath(outputPath);
  return requireNativeMethod('pdfToWord')(inputPath, outputPath);
}

export async function convertWordToPdf(inputPath: string, outputPath: string): Promise<string> {
  validatePath(inputPath);
  validatePath(outputPath);
  return requireNativeMethod('wordToPdf')(inputPath, outputPath);
}
