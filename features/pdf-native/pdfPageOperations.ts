import { NativeModules, Platform } from 'react-native';

type PdfPageApi = {
  split(inputPath: string, outputDirectory: string, pageRanges: string[]): Promise<string[]>;
  reorder(inputPath: string, outputPath: string, pageOrder: number[]): Promise<string>;
};

const nativeModule = NativeModules.NexusPdfNative as PdfPageApi | undefined;

function validatePath(path: string): void {
  if (!path || path.length > 4096 || /[\u0000\r\n]/.test(path)) throw new Error('Invalid PDF path.');
}

function validateRanges(ranges: string[]): void {
  if (!Array.isArray(ranges) || ranges.length === 0 || ranges.length > 100) throw new Error('Select at least one page range.');
  ranges.forEach((range) => {
    if (!range.trim() || !/^\d+(?:-\d+)?$/.test(range.trim())) throw new Error(`Invalid page range: ${range}`);
  });
}

function validatePageOrder(pageOrder: number[]): void {
  if (!Array.isArray(pageOrder) || pageOrder.length === 0 || pageOrder.length > 1000) throw new Error('Invalid page order.');
  pageOrder.forEach((page, index) => {
    if (!Number.isInteger(page) || page < 1) throw new Error(`Invalid page number at position ${index + 1}.`);
  });
}

export const splitPdfWithNativeEngine = async (
  inputPath: string,
  outputDirectory: string,
  pageRanges: string[],
): Promise<string[]> => {
  validatePath(inputPath);
  validatePath(outputDirectory);
  validateRanges(pageRanges);
  if (!nativeModule?.split) {
    throw new Error(`PDF split is not available in the current ${Platform.OS} native build yet.`);
  }
  return nativeModule.split(inputPath, outputDirectory, pageRanges);
};

export const reorderPdfWithNativeEngine = async (
  inputPath: string,
  outputPath: string,
  pageOrder: number[],
): Promise<string> => {
  validatePath(inputPath);
  validatePath(outputPath);
  validatePageOrder(pageOrder);
  if (!nativeModule?.reorder) {
    throw new Error(`PDF reorder is not available in the current ${Platform.OS} native build yet.`);
  }
  return nativeModule.reorder(inputPath, outputPath, pageOrder);
};
