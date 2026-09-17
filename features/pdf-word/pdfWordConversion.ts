import { NativeModules, Platform } from 'react-native';

type PdfWordApi = {
  pdfToWord(inputPath: string, outputPath: string): Promise<string>;
  wordToPdf(inputPath: string, outputPath: string): Promise<string>;
  isDocumentEngineAvailable?: () => Promise<boolean>;
};

const nativeModule = NativeModules.NexusPdfNative as Partial<PdfWordApi> | undefined;

function validatePath(path: string): void {
  if (!path || path.length > 4096 || /[\u0000\r\n]/.test(path)) {
    throw new Error('Invalid document path.');
  }
}

function requireNativeMethod<K extends keyof PdfWordApi>(method: K): NonNullable<PdfWordApi[K]> {
  const fn = nativeModule?.[method];
  if (!fn || typeof fn !== 'function') {
    throw new Error(`PDF ⇄ Word conversion is not available in the current ${Platform.OS} native build.`);
  }
  return fn as NonNullable<PdfWordApi[K]>;
}

/**
 * Returns whether a real document conversion engine is present in the native build.
 * This is intentionally distinct from the existing PDFBox availability check:
 * PDFBox handles PDF operations but is not itself a DOCX conversion engine.
 */
export async function isDocumentEngineAvailable(): Promise<boolean> {
  const probe = nativeModule?.isDocumentEngineAvailable;
  if (!probe || typeof probe !== 'function') return false;
  try {
    return await probe();
  } catch {
    return false;
  }
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
