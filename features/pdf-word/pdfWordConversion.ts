import { NativeModules, Platform } from 'react-native';

/** Existing Gotenberg service already configured in Nexus Plus. */
export const GOTENBERG_BASE_URL = 'https://gotenberg-8-gm77.onrender.com';
const GOTENBERG_LIBREOFFICE_ROUTE = '/forms/libreoffice/convert';

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

export async function isDocumentEngineAvailable(): Promise<boolean> {
  if (nativeModule?.isDocumentEngineAvailable) {
    return nativeModule.isDocumentEngineAvailable();
  }
  return typeof nativeModule?.pdfToWord === 'function' && typeof nativeModule?.wordToPdf === 'function';
}

async function uploadToGotenberg(inputPath: string, outputFilename: string): Promise<string> {
  validatePath(inputPath);
  const response = await fetch(`${GOTENBERG_BASE_URL}${GOTENBERG_LIBREOFFICE_ROUTE}`, {
    method: 'POST',
    body: (() => {
      const form = new FormData();
      form.append('files', {
        uri: inputPath,
        name: inputPath.split('/').pop() || 'document.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      } as unknown as Blob);
      return form;
    })(),
    headers: { 'Gotenberg-Output-Filename': outputFilename.replace(/\.[^.]+$/, '') },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Gotenberg conversion failed (${response.status}).${message ? ` ${message.slice(0, 300)}` : ''}`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function convertPdfToWord(inputPath: string, outputPath: string): Promise<string> {
  validatePath(inputPath);
  validatePath(outputPath);
  const nativeConvert = requireNativeMethod('pdfToWord');
  return nativeConvert(inputPath, outputPath);
}

export async function convertWordToPdf(inputPath: string, outputPath: string): Promise<string> {
  validatePath(inputPath);
  validatePath(outputPath);
  const nativeConvert = nativeModule?.wordToPdf;
  if (nativeConvert) return nativeConvert(inputPath, outputPath);
  const baseName = inputPath.split('/').pop() || 'document.docx';
  return uploadToGotenberg(inputPath, baseName.replace(/\.docx$/i, ''));
}

/**
 * Shared entry point for PDF tools that need the already-configured Gotenberg service.
 * No second Gotenberg URL is introduced.
 */
export async function convertOfficeDocumentWithExistingGotenberg(inputPath: string, outputFilename: string): Promise<string> {
  validatePath(inputPath);
  return uploadToGotenberg(inputPath, outputFilename);
}
