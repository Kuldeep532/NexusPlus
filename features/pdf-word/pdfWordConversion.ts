import { NativeModules, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

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
  if (nativeModule?.isDocumentEngineAvailable) return nativeModule.isDocumentEngineAvailable();
  return typeof nativeModule?.pdfToWord === 'function' && typeof nativeModule?.wordToPdf === 'function';
}

async function uploadToGotenberg(inputPath: string, outputFilename: string, inputMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'): Promise<string> {
  validatePath(inputPath);
  const response = await fetch(`${GOTENBERG_BASE_URL}${GOTENBERG_LIBREOFFICE_ROUTE}`, {
    method: 'POST',
    body: (() => {
      const form = new FormData();
      form.append('files', {
        uri: inputPath,
        name: inputPath.split('/').pop() || 'document.docx',
        type: inputMimeType,
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
  return requireNativeMethod('pdfToWord')(inputPath, outputPath);
}

export async function convertWordToPdf(inputPath: string, outputPath: string): Promise<string> {
  validatePath(inputPath);
  validatePath(outputPath);
  const nativeConvert = nativeModule?.wordToPdf;
  if (nativeConvert) return nativeConvert(inputPath, outputPath);
  const baseName = inputPath.split('/').pop() || 'document.docx';
  return convertOfficeDocumentWithExistingGotenberg(inputPath, `${baseName.replace(/\.[^.]+$/, '')}.pdf`);
}

/**
 * Reuse the same Gotenberg service already used by PDF ⇄ Word.
 * The returned PDF is persisted into the caller-provided output path.
 */
export async function convertOfficeDocumentWithExistingGotenberg(inputPath: string, outputFilename: string, inputMimeType?: string): Promise<string> {
  validatePath(inputPath);
  const outputUri = await uploadToGotenberg(inputPath, outputFilename, inputMimeType);
  try {
    const outputPath = `${FileSystem.cacheDirectory ?? ''}${outputFilename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    if (!outputPath || !FileSystem.cacheDirectory) return outputUri;
    const base64Response = await fetch(outputUri);
    const base64 = await base64Response.arrayBuffer();
    const bytes = new Uint8Array(base64);
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunkSize, bytes.length)));
    }
    const encoded = globalThis.btoa(binary);
    await FileSystem.writeAsStringAsync(outputPath, encoded, { encoding: FileSystem.EncodingType.Base64 });
    return outputPath;
  } finally {
    URL.revokeObjectURL(outputUri);
  }
}
