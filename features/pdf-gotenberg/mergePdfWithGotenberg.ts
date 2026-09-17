import * as FileSystem from 'expo-file-system';
import { GOTENBERG_BASE_URL } from '@/features/pdf-word/pdfWordConversion';

const MERGE_ROUTE = '/forms/pdfengines/merge';

function validatePath(path: string): void {
  if (!path || path.length > 4096 || /[\u0000\r\n]/.test(path)) throw new Error('Invalid PDF path.');
}

export async function mergePdfsWithGotenberg(inputPaths: string[], outputFilename = `merged-${Date.now()}.pdf`): Promise<string> {
  if (!Array.isArray(inputPaths) || inputPaths.length < 2 || inputPaths.length > 50) {
    throw new Error('Select between 2 and 50 PDF files.');
  }
  inputPaths.forEach(validatePath);
  const safeName = outputFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const form = new FormData();
  inputPaths.forEach((uri, index) => {
    form.append('files', {
      uri,
      name: uri.split('/').pop() || `document-${index + 1}.pdf`,
      type: 'application/pdf',
    } as unknown as Blob);
  });
  const response = await fetch(`${GOTENBERG_BASE_URL}${MERGE_ROUTE}`, {
    method: 'POST',
    body: form,
    headers: { 'Gotenberg-Output-Filename': safeName.replace(/\.pdf$/i, '') },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Gotenberg PDF merge failed (${response.status}).${message ? ` ${message.slice(0, 300)}` : ''}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
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
