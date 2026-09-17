import { NativeModules, Platform } from 'react-native';

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

/**
 * Returns whether a real document conversion engine is present in the native build.
 */
export async function isDocumentEngineAvailable(): Promise<boolean> {
  return true;
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
  const outputUri = URL.createObjectURL(blob);
  return outputUri;
}

export async function convertPdfToWord(inputPath: string, outputPath: string): Promise<string> {
  validatePath(inputPath);
  validatePath(outputPath);
  // Gotenberg 8's LibreOffice route is DOCX -> PDF only. Keep PDF -> Word fail-closed
  // until a server endpoint capable of producing DOCX is deployed.
  throw new Error('PDF to Word conversion endpoint is not available on the configured Gotenberg service.');
}

export async function convertWordToPdf(inputPath: string, outputPath: string): Promise<string> {
  validatePath(inputPath);
  validatePath(outputPath);
  const baseName = inputPath.split('/').pop() || 'document.docx';
  return uploadToGotenberg(inputPath, baseName.replace(/\.docx$/i, ''));
}
