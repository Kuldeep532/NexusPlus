import { NativeModules, Platform } from 'react-native';
import { buildPageOrder, pageRangeStrings } from './pdfPageInput';

type PdfPageApi = {
  split(inputPath: string, outputDirectory: string, pageRanges: string[]): Promise<string[]>;
  reorder(inputPath: string, outputPath: string, pageOrder: number[]): Promise<string>;
  rotate(inputPath: string, outputPath: string, degrees: number): Promise<string>;
  preparePdfOutput(category: string, filename: string): Promise<string>;
  removePdfWatermark?: (inputPath: string, outputPath: string): Promise<string>;
};

const nativeModule = NativeModules.NexusPdfNative as PdfPageApi | undefined;
function validatePath(path: string): void { if (!path || path.length > 4096 || /[\u0000\r\n]/.test(path)) throw new Error('Invalid PDF path.'); }
export async function preparePdfOutputPath(category: string, filename: string): Promise<string> { if (!nativeModule?.preparePdfOutput) throw new Error(`PDF persistent storage is not available in the current ${Platform.OS} native build yet.`); return nativeModule.preparePdfOutput(category, filename); }
export async function removePdfWatermarkWithNativeEngine(inputPath: string, outputPath: string): Promise<string> { validatePath(inputPath); validatePath(outputPath); if (!nativeModule?.removePdfWatermark) throw new Error(`PDF watermark removal is not available in the current ${Platform.OS} native build.`); return nativeModule.removePdfWatermark(inputPath, outputPath); }
export const splitPdfWithNativeEngine = async (inputPath: string, outputDirectory: string, pageRanges: string[], pageCount?: number): Promise<string[]> => { validatePath(inputPath); validatePath(outputDirectory); if (!Array.isArray(pageRanges) || pageRanges.length === 0 || pageRanges.length > 100) throw new Error('Select at least one page range.'); const safeRanges = pageCount === undefined ? pageRanges : pageRangeStrings(pageRanges.join(', '), pageCount); safeRanges.forEach((range) => { if (!/^\d+(?:-\d+)?$/.test(range)) throw new Error(`Invalid page range: ${range}`); }); if (!nativeModule?.split) throw new Error(`PDF split is not available in the current ${Platform.OS} native build yet.`); return nativeModule.split(inputPath, outputDirectory, safeRanges); };
export const reorderPdfWithNativeEngine = async (inputPath: string, outputPath: string, pageOrder: number[], pageCount?: number): Promise<string> => { validatePath(inputPath); validatePath(outputPath); const safePageCount = pageCount === undefined ? pageOrder.length : pageCount; const safeOrder = buildPageOrder(safePageCount, pageOrder); if (!nativeModule?.reorder) throw new Error(`PDF reorder is not available in the current ${Platform.OS} native build yet.`); return nativeModule.reorder(inputPath, outputPath, safeOrder); };
export const rotatePdfWithNativeEngine = async (inputPath: string, outputPath: string, degrees: number): Promise<string> => { validatePath(inputPath); validatePath(outputPath); if (![90, 180, 270].includes(degrees)) throw new Error('Rotation must be 90, 180, or 270 degrees.'); if (!nativeModule?.rotate) throw new Error(`PDF rotate is not available in the current ${Platform.OS} native build yet.`); return nativeModule.rotate(inputPath, outputPath, degrees); };
