import { NativeModules, Platform } from 'react-native';
import { buildPageOrder, pageRangeStrings } from './pdfPageInput';

type PdfPageApi = {
  split(inputPath: string, outputDirectory: string, pageRanges: string[]): Promise<string[]>;
  reorder(inputPath: string, outputPath: string, pageOrder: number[]): Promise<string>;
  rotate(inputPath: string, outputPath: string, degrees: number): Promise<string>;
  preparePdfOutput(category: string, filename: string): Promise<string>;
};

const nativeModule = NativeModules.NexusPdfNative as PdfPageApi | undefined;
const GOTENBERG_BASE_URL = 'https://gotenberg-8-gm77.onrender.com';
const GOTENBERG_WATERMARK_ROUTE = '/forms/pdfengines/watermark';

function validatePath(path: string): void { if (!path || path.length > 4096 || /[\u0000\r\n]/.test(path)) throw new Error('Invalid PDF path.'); }
export async function preparePdfOutputPath(category: string, filename: string): Promise<string> { if (!nativeModule?.preparePdfOutput) throw new Error(`PDF persistent storage is not available in the current ${Platform.OS} native build yet.`); return nativeModule.preparePdfOutput(category, filename); }

export async function addPdfWatermarkWithGotenberg(inputPath: string, outputPath: string, outputFilename: string, text: string): Promise<string> {
  validatePath(inputPath); validatePath(outputPath); validatePath(text);
  if (!text.trim()) throw new Error('Watermark text is required.');
  const form = new FormData();
  form.append('files', { uri: inputPath, name: inputPath.split('/').pop() || 'document.pdf', type: 'application/pdf' } as unknown as Blob);
  form.append('watermarkSource', 'text');
  form.append('watermarkExpression', text.trim());
  form.append('watermarkOptions', JSON.stringify({ opacity: 0.25, rotation: 45, points: 48, color: '#808080' }));
  const response = await fetch(`${GOTENBERG_BASE_URL}${GOTENBERG_WATERMARK_ROUTE}`, { method: 'POST', body: form, headers: { 'Gotenberg-Output-Filename': outputFilename.replace(/\.pdf$/i, '') } });
  if (!response.ok) { const message = await response.text().catch(() => ''); throw new Error(`Gotenberg watermark request failed (${response.status}).${message ? ` ${message.slice(0, 300)}` : ''}`); }
  const bytes = new Uint8Array(await response.arrayBuffer());
  const outputTarget = outputPath;
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunkSize, bytes.length)));
  const base64 = globalThis.btoa(binary);
  // React Native native output paths are handled by the native storage boundary; when unavailable, return a cache-safe URI.
  try {
    const fs = require('expo-file-system') as typeof import('expo-file-system');
    await fs.writeAsStringAsync(outputTarget, base64, { encoding: fs.EncodingType.Base64 });
    return outputTarget;
  } catch {
    const cache = typeof require('expo-file-system').cacheDirectory === 'string' ? require('expo-file-system').cacheDirectory as string : '';
    const fallback = `${cache}${outputFilename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const fs = require('expo-file-system') as typeof import('expo-file-system');
    if (!fs.cacheDirectory) throw new Error('PDF output storage is unavailable.');
    await fs.writeAsStringAsync(fallback, base64, { encoding: fs.EncodingType.Base64 });
    return fallback;
  }
}

export const splitPdfWithNativeEngine = async (inputPath: string, outputDirectory: string, pageRanges: string[], pageCount?: number): Promise<string[]> => { validatePath(inputPath); validatePath(outputDirectory); if (!Array.isArray(pageRanges) || pageRanges.length === 0 || pageRanges.length > 100) throw new Error('Select at least one page range.'); const safeRanges = pageCount === undefined ? pageRanges : pageRangeStrings(pageRanges.join(', '), pageCount); safeRanges.forEach((range) => { if (!/^\d+(?:-\d+)?$/.test(range)) throw new Error(`Invalid page range: ${range}`); }); if (!nativeModule?.split) throw new Error(`PDF split is not available in the current ${Platform.OS} native build yet.`); return nativeModule.split(inputPath, outputDirectory, safeRanges); };
export const reorderPdfWithNativeEngine = async (inputPath: string, outputPath: string, pageOrder: number[], pageCount?: number): Promise<string> => { validatePath(inputPath); validatePath(outputPath); const safePageCount = pageCount === undefined ? pageOrder.length : pageCount; const safeOrder = buildPageOrder(safePageCount, pageOrder); if (!nativeModule?.reorder) throw new Error(`PDF reorder is not available in the current ${Platform.OS} native build yet.`); return nativeModule.reorder(inputPath, outputPath, safeOrder); };
export const rotatePdfWithNativeEngine = async (inputPath: string, outputPath: string, degrees: number): Promise<string> => { validatePath(inputPath); validatePath(outputPath); if (![90, 180, 270].includes(degrees)) throw new Error('Rotation must be 90, 180, or 270 degrees.'); if (!nativeModule?.rotate) throw new Error(`PDF rotate is not available in the current ${Platform.OS} native build yet.`); return nativeModule.rotate(inputPath, outputPath, degrees); };
