export type PdfPageRange = { start: number; end: number };

const MAX_PDF_PAGES = 1000;
const MAX_RANGES = 100;

export function assertValidPageCount(pageCount: number): number {
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > MAX_PDF_PAGES) {
    throw new Error(`This PDF must contain between 1 and ${MAX_PDF_PAGES} pages.`);
  }
  return pageCount;
}

export function clampPageNumber(value: string | number, pageCount: number): string {
  assertValidPageCount(pageCount);
  const parsed = typeof value === 'number' ? value : Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return '';
  return String(Math.min(parsed, pageCount));
}

export function sanitizePageRangeInput(value: string, pageCount: number): string {
  assertValidPageCount(pageCount);
  if (!value.trim()) return '';
  const parts = value.split(',').slice(0, MAX_RANGES).map((part) => part.trim()).filter(Boolean);
  return parts.map((part) => {
    const match = part.match(/^(\d+)\s*(?:-\s*(\d+))?$/);
    if (!match) return '';
    const start = Math.min(Number(match[1]), pageCount);
    const end = match[2] ? Math.min(Number(match[2]), pageCount) : start;
    return `${Math.min(start, end)}${match[2] ? `-${Math.max(start, end)}` : ''}`;
  }).filter(Boolean).join(', ');
}

export function parsePageRanges(value: string, pageCount: number): PdfPageRange[] {
  const sanitized = sanitizePageRangeInput(value, pageCount);
  if (!sanitized) throw new Error('Enter at least one valid page number or range.');
  const ranges = sanitized.split(',').map((part) => part.trim()).filter(Boolean).map((part) => {
    const [rawStart, rawEnd] = part.split('-');
    const start = Number(rawStart);
    const end = rawEnd ? Number(rawEnd) : start;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1 || start > pageCount || end > pageCount) {
      throw new Error(`Page numbers must stay between 1 and ${pageCount}.`);
    }
    return { start: Math.min(start, end), end: Math.max(start, end) };
  });
  if (ranges.length > MAX_RANGES) throw new Error(`You can enter up to ${MAX_RANGES} page ranges.`);
  return ranges;
}

export function pageRangeStrings(value: string, pageCount: number): string[] {
  return parsePageRanges(value, pageCount).map(({ start, end }) => start === end ? String(start) : `${start}-${end}`);
}

export function buildPageOrder(pageCount: number, rawOrder: number[]): number[] {
  assertValidPageCount(pageCount);
  if (rawOrder.length !== pageCount) throw new Error('Page order must include every page.');
  const normalized = rawOrder.map((page) => {
    if (!Number.isInteger(page) || page < 1 || page > pageCount) throw new Error(`Page numbers must stay between 1 and ${pageCount}.`);
    return page;
  });
  if (new Set(normalized).size !== pageCount) throw new Error('Each PDF page must appear exactly once.');
  return normalized;
}
