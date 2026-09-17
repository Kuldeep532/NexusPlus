import * as FileSystem from 'expo-file-system';
import { GOTENBERG_BASE_URL } from '@/features/pdf-word/pdfWordConversion';

const READ_METADATA_ROUTE = '/forms/pdfengines/metadata/read';
const WRITE_METADATA_ROUTE = '/forms/pdfengines/metadata/write';

function validatePath(path: string): void {
  if (!path || path.length > 4096 || /[\u0000\r\n]/.test(path)) throw new Error('Invalid PDF path.');
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.pdf$/i, '') || 'document';
}

function formForPdf(inputPath: string): FormData {
  validatePath(inputPath);
  const form = new FormData();
  form.append('files', {
    uri: inputPath,
    name: inputPath.split('/').pop() || 'document.pdf',
    type: 'application/pdf',
  } as unknown as Blob);
  return form;
}

export async function readPdfMetadataWithGotenberg(inputPath: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${GOTENBERG_BASE_URL}${READ_METADATA_ROUTE}`, {
    method: 'POST',
    body: formForPdf(inputPath),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Gotenberg metadata read failed (${response.status}).${message ? ` ${message.slice(0, 300)}` : ''}`);
  }
  const payload = await response.json() as Record<string, Record<string, unknown>>;
  const firstFile = Object.keys(payload)[0];
  return firstFile ? (payload[firstFile] ?? {}) : {};
}

export async function writePdfMetadataWithGotenberg(
  inputPath: string,
  outputFilename: string,
  metadata: Record<string, unknown>,
): Promise<string> {
  const form = formForPdf(inputPath);
  form.append('metadata', JSON.stringify(metadata));
  const response = await fetch(`${GOTENBERG_BASE_URL}${WRITE_METADATA_ROUTE}`, {
    method: 'POST',
    body: form,
    headers: { 'Gotenberg-Output-Filename': safeName(outputFilename) },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Gotenberg metadata write failed (${response.status}).${message ? ` ${message.slice(0, 300)}` : ''}`);
  }
  const buffer = await response.arrayBuffer();
  if (!FileSystem.cacheDirectory) throw new Error('Device file cache is unavailable.');
  const outputPath = `${FileSystem.cacheDirectory}${safeName(outputFilename)}.pdf`;
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunkSize, bytes.length)));
  }
  await FileSystem.writeAsStringAsync(outputPath, globalThis.btoa(binary), { encoding: FileSystem.EncodingType.Base64 });
  return outputPath;
}
