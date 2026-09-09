import { NativeModules, Platform } from 'react-native';
import { buildPageOrder, pageRangeStrings } from './pdfPageInput';

type PdfNativeApi = {
  isAvailable(): Promise<boolean>;
  merge(inputPaths: string[], outputPath: string): Promise<string>;
  imageToPdf(inputPaths: string[], outputPath: string, quality: number): Promise<string>;
  pdfToImages(inputPath: string, outputDirectory: string, pageNumbers: number[], dpi: number, format: string): Promise<string[]>;
  combineImages(inputPaths: string[], outputPath: string, format: string, quality: number): Promise<string>;
  unlock(inputPath: string, outputPath: string, password: string): Promise<string>;
  protect(inputPath: string, outputPath: string, password: string): Promise<string>;
  compress(inputPath: string, outputPath: string, quality: number): Promise<string>;
  split(inputPath: string, outputDirectory: string, pageRanges: string[]): Promise<string[]>;
  reorder(inputPath: string, outputPath: string, pageOrder: number[]): Promise<string>;
  rotate(inputPath: string, outputPath: string, pageRanges: string[], angle: number): Promise<string>;
  preparePdfOutput(category: string, filename: string): Promise<string>;
  preparePdfToolOutput(category: string, filename: string): Promise<string>;
};

const nativeModule = NativeModules.NexusPdfNative as PdfNativeApi | undefined;

async function requireNative(): Promise<PdfNativeApi> {
  if (!nativeModule) throw new Error(`Nexus PDF native module is unavailable on ${Platform.OS}.`);
  try {
    if (!(await nativeModule.isAvailable())) throw new Error('Nexus PDF native module is unavailable in this build.');
  } catch {
    throw new Error('Nexus PDF native module is unavailable in this build.');
  }
  return nativeModule;
}

function validatePath(path: string): void {
  if (!path || path.length > 4096 || /[\u0000\r\n]/.test(path)) throw new Error('Invalid PDF path.');
}
function validatePaths(paths: string[]): void {
  if (!Array.isArray(paths) || paths.length === 0 || paths.length > 100) throw new Error('Invalid PDF input list.');
  paths.forEach(validatePath);
}
function validateRotation(angle: number): number {
  if (!Number.isInteger(angle) || ![90, 180, 270].includes(angle)) throw new Error('Rotation must be 90, 180, or 270 degrees.');
  return angle;
}
function validateImageFormat(format: string): 'png' | 'jpeg' {
  const normalized = format.toLowerCase();
  if (normalized !== 'png' && normalized !== 'jpeg' && normalized !== 'jpg') throw new Error('Image format must be PNG or JPG.');
  return normalized === 'png' ? 'png' : 'jpeg';
}

export const PdfNativeBridge = {
  isAvailable: async () => {
    if (!nativeModule) return false;
    try { return await nativeModule.isAvailable(); } catch { return false; }
  },
  merge: async (inputPaths: string[], outputPath: string) => { validatePaths(inputPaths); validatePath(outputPath); return (await requireNative()).merge(inputPaths, outputPath); },
  imageToPdf: async (inputPaths: string[], outputPath: string, quality = 90) => {
    validatePaths(inputPaths); validatePath(outputPath); if (!Number.isFinite(quality)) throw new Error('Invalid image quality.');
    return (await requireNative()).imageToPdf(inputPaths, outputPath, Math.max(1, Math.min(100, Math.round(quality))));
  },
  pdfToImages: async (inputPath: string, outputDirectory: string, pageNumbers: number[], dpi = 300, format = 'png', pageCount?: number) => {
    validatePath(inputPath); validatePath(outputDirectory);
    if (!Array.isArray(pageNumbers) || pageNumbers.length === 0 || pageNumbers.length > 1000) throw new Error('Select at least one valid PDF page.');
    const safePages = pageCount === undefined ? pageNumbers : buildPageOrder(pageCount, Array.from(new Set(pageNumbers)).sort((a, b) => a - b));
    const safeDpi = Math.max(72, Math.min(600, Math.round(Number(dpi) || 300)));
    return (await requireNative()).pdfToImages(inputPath, outputDirectory, safePages, safeDpi, validateImageFormat(format));
  },
  combineImages: async (inputPaths: string[], outputPath: string, format = 'png', quality = 95) => {
    validatePaths(inputPaths); validatePath(outputPath);
    if (inputPaths.length < 2) throw new Error('Select at least two images to combine.');
    return (await requireNative()).combineImages(inputPaths, outputPath, validateImageFormat(format), Math.max(1, Math.min(100, Math.round(quality))));
  },
  protect: async (inputPath: string, outputPath: string, password: string) => { validatePath(inputPath); validatePath(outputPath); if (!password) throw new Error('PDF password is required.'); return (await requireNative()).protect(inputPath, outputPath, password); },
  unlock: async (inputPath: string, outputPath: string, password: string) => { validatePath(inputPath); validatePath(outputPath); if (!password) throw new Error('PDF password is required.'); return (await requireNative()).unlock(inputPath, outputPath, password); },
  compress: async (inputPath: string, outputPath: string, quality = 75) => { validatePath(inputPath); validatePath(outputPath); if (!Number.isFinite(quality)) throw new Error('Invalid compression quality.'); return (await requireNative()).compress(inputPath, outputPath, Math.max(1, Math.min(100, Math.round(quality)))); },
  split: async (inputPath: string, outputDirectory: string, pageRanges: string[], pageCount?: number) => {
    validatePath(inputPath); validatePath(outputDirectory); if (!Array.isArray(pageRanges) || pageRanges.length === 0 || pageRanges.length > 100) throw new Error('Invalid PDF page ranges.');
    const safeRanges = pageCount === undefined ? pageRanges : pageRangeStrings(pageRanges.join(', '), pageCount); return (await requireNative()).split(inputPath, outputDirectory, safeRanges);
  },
  reorder: async (inputPath: string, outputPath: string, pageOrder: number[], pageCount?: number) => { validatePath(inputPath); validatePath(outputPath); const safeOrder = pageCount === undefined ? pageOrder : buildPageOrder(pageCount, pageOrder); return (await requireNative()).reorder(inputPath, outputPath, safeOrder); },
  rotate: async (inputPath: string, outputPath: string, pageRanges: string[], angle: number, pageCount?: number) => { validatePath(inputPath); validatePath(outputPath); validateRotation(angle); if (!Array.isArray(pageRanges) || pageRanges.length === 0 || pageRanges.length > 100) throw new Error('Select at least one page range.'); const safeRanges = pageCount === undefined ? pageRanges : pageRangeStrings(pageRanges.join(', '), pageCount); return (await requireNative()).rotate(inputPath, outputPath, safeRanges, angle); },
  preparePdfOutput: async (category: string, filename: string) => { if (!category.trim() || !filename.trim()) throw new Error('PDF output category and filename are required.'); return (await requireNative()).preparePdfOutput(category, filename); },
  preparePdfToolOutput: async (category: string, filename: string) => { if (!category.trim() || !filename.trim()) throw new Error('PDF output category and filename are required.'); return (await requireNative()).preparePdfToolOutput(category, filename); },
};
