import * as FileSystem from 'expo-file-system';
import { GOTENBERG_BASE_URL } from '@/features/pdf-word/pdfWordConversion';

const FLATTEN_ROUTE = '/forms/pdfengines/flatten';

function validatePath(path: string): void {
  if (!path || path.length > 4096 || /[\u0000\r\n]/.test(path)) throw new Error('Invalid PDF path.');
}

export async function flattenPdfWithGotenberg(inputPath: string, outputFilename: string): Promise<string> {
  validatePath(inputPath);
  const safeName = outputFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const response = await fetch(`${GOTENBERG_BASE_URL}${FLATTEN_ROUTE}`, {
    method: 'POST',
    body: (() => {
      const form = new FormData();
      form.append('files', {
        uri: inputPath,
        name: inputPath.split('/').pop() || 'document.pdf',
        type: 'application/pdf',
      } as unknown as Blob);
      return form;
    })(),
    headers: { 'Gotenberg-Output-Filename': safeName.replace(/\.pdf$/i, '') },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Gotenberg PDF flattening failed (${response.status}).${message ? ` ${message.slice(0, 300)}` : ''}`);
  }
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunkSize, bytes.length)));
  }
  if (!FileSystem.cacheDirectory) throw new Error('Device file cache is unavailable.');
  const outputPath = `${FileSystem.cacheDirectory}${safeName}`;
  await FileSystem.writeAsStringAsync(outputPath, globalThis.btoa(binary), { encoding: FileSystem.EncodingType.Base64 });
  return outputPath;
}
