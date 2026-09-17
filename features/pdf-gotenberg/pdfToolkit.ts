import * as FileSystem from 'expo-file-system';
import { GOTENBERG_BASE_URL } from '@/features/pdf-word/pdfWordConversion';

const PDFTK_ROUTE = '/forms/pdfengines/merge';

function validatePath(path: string): void {
  if (!path || path.length > 4096 || /[\u0000\r\n]/.test(path)) throw new Error('Invalid PDF path.');
}

function safeName(name: string): string {
  return (name || 'processed.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function responseToFile(response: Response, filename: string): Promise<string> {
  if (!FileSystem.cacheDirectory) throw new Error('Device file cache is unavailable.');
  const safeFilename = safeName(filename);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunkSize, bytes.length)));
  }
  const output = `${FileSystem.cacheDirectory}${safeFilename}`;
  await FileSystem.writeAsStringAsync(output, globalThis.btoa(binary), { encoding: FileSystem.EncodingType.Base64 });
  return output;
}

export async function buildCombinedPdfWithGotenberg(inputPaths: string[], outputFilename: string): Promise<string> {
  if (!Array.isArray(inputPaths) || inputPaths.length < 2 || inputPaths.length > 50) throw new Error('Select between 2 and 50 PDF files.');
  inputPaths.forEach(validatePath);
  const form = new FormData();
  inputPaths.forEach((uri, index) => {
    form.append('files', {
      uri,
      name: uri.split('/').pop() || `document-${index + 1}.pdf`,
      type: 'application/pdf',
    } as unknown as Blob);
  });
  const response = await fetch(`${GOTENBERG_BASE_URL}${PDFTK_ROUTE}`, {
    method: 'POST', body: form,
    headers: { 'Gotenberg-Output-Filename': safeName(outputFilename).replace(/\.pdf$/i, '') },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Gotenberg PDF toolkit failed (${response.status}).${message ? ` ${message.slice(0, 300)}` : ''}`);
  }
  return responseToFile(response, outputFilename);
}
