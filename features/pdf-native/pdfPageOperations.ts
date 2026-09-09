import { NativeModules, Platform } from 'react-native';
import { assertValidPageCount, buildPageOrder, pageRangeStrings } from './pdfPageInput';

type PdfPageApi = {
  split(inputPath: string, outputDirectory: string, pageRanges: string[]): Promise<string[]>;
  reorder(inputPath: string, outputPath: string, pageOrder: number[]): Promise<string>;
};

const nativeModule = NativeModules.NexusPdfNative as PdfPageApi | undefined;

function validatePath(path: string): void {
  if (!path || path.length > 4096 || /[\u0000\r\n]/.test(path)) throw new Error('Invalid PDF path.');
}

export const splitPdfWithNativeEngine = async (
  inputPath: string,
  outputDirectory: string,
  pageRanges: string[],
  pageCount?: number,
): Promise<string[]> => {
  validatePath(inputPath);
  validatePath(outputDirectory);
  if (!Array.isArray(pageRanges) || pageRanges.length === 0 || pageRanges.length > 100) throw new Error('Select at least one page range.');
  const safeRanges = pageCount === undefined
    ? pageRanges
    : pageRangeStrings(pageRanges.join(', '), assertValidPageCount(pageCount));
  safeRanges.forEach((range) => {
    if (!/^\d+(?:-\d+)?$/.test(range)) throw new Error(`Invalid page range: ${range}`);
  });
  if (!nativeModule?.split) {
    throw new Error(`PDF split is not available in the current ${Platform.OS} native build yet.`);
  }
  return nativeModule.split(inputPath, outputDirectory, safeRanges);
};

export const reorderPdfWithNativeEngine = async (
  inputPath: string,
  outputPath: string,
  pageOrder: number[],
  pageCount?: number,
): Promise<string> => {
  validatePath(inputPath);
  validatePath(outputPath);
  const safePageCount = pageCount === undefined ? pageOrder.length : assertValidPageCount(pageCount);
  const safeOrder = buildPageOrder(safePageCount, pageOrder);
  if (!nativeModule?.reorder) {
    throw new Error(`PDF reorder is not available in the current ${Platform.OS} native build yet.`);
  }
  return nativeModule.reorder(inputPath, outputPath, safeOrder);
};
