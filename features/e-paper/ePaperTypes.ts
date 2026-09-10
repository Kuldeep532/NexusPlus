export type EPaperPaperSize = 'a4' | 'letter' | 'tabloid' | 'a3' | 'custom';
export type EPaperOrientation = 'portrait' | 'landscape';
export type EPaperElementType = 'headline' | 'subheadline' | 'body' | 'image' | 'caption' | 'quote' | 'divider' | 'spacer' | 'label';
export type EPaperTextAlign = 'left' | 'center' | 'right' | 'justify';
export type EPaperFit = 'cover' | 'contain' | 'fill';

export type EPaperElementBase = {
  id: string;
  type: EPaperElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  visible?: boolean;
  zIndex?: number;
};

export type EPaperTextElement = EPaperElementBase & {
  type: 'headline' | 'subheadline' | 'body' | 'caption' | 'quote' | 'label';
  text: string;
  fontSize: number;
  fontWeight: '400' | '600' | '700' | '800';
  lineHeight: number;
  letterSpacing?: number;
  fontFamily?: string;
  color?: string;
  align: EPaperTextAlign;
};

export type EPaperImageElement = EPaperElementBase & {
  type: 'image';
  uri: string;
  name: string;
  fit: EPaperFit;
  caption?: string;
  linkedChunkId?: string;
  linkedSectionId?: string;
  matchScore?: number;
  matchReasons?: string[];
};

export type EPaperShapeElement = EPaperElementBase & {
  type: 'divider' | 'spacer';
  color?: string;
  thickness?: number;
};

export type EPaperElement = EPaperTextElement | EPaperImageElement | EPaperShapeElement;

export type EPaperPage = {
  id: string;
  elements: EPaperElement[];
  background?: string;
};

export type EPaperDocument = {
  version: 1;
  title: string;
  publisher: string;
  editionDate: string;
  paperSize: EPaperPaperSize;
  orientation: EPaperOrientation;
  customWidth?: number;
  customHeight?: number;
  columns: number;
  gutter: number;
  margin: number;
  background: string;
  ink: string;
  accent: string;
  pages: EPaperPage[];
};

export const PAPER_POINTS: Record<Exclude<EPaperPaperSize, 'custom'>, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  tabloid: { width: 792, height: 1224 },
  a3: { width: 841.89, height: 1190.55 },
};

export function getPaperPoints(doc: Pick<EPaperDocument, 'paperSize' | 'orientation' | 'customWidth' | 'customHeight'>) {
  const base = doc.paperSize === 'custom'
    ? { width: doc.customWidth || 595.28, height: doc.customHeight || 841.89 }
    : PAPER_POINTS[doc.paperSize];
  return doc.orientation === 'landscape'
    ? { width: base.height, height: base.width }
    : base;
}
