export type Point = { x: number; y: number };
export type ToolKind = 'pen' | 'pencil' | 'marker' | 'highlighter' | 'brush' | 'eraser' | 'line' | 'rectangle' | 'ellipse' | 'arrow';

export type Stroke = {
  id: string;
  tool: ToolKind;
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  fill?: string;
};

export type SketchDocument = {
  version: 2;
  width: number;
  height: number;
  background: string;
  strokes: Stroke[];
};

export type SketchSettings = {
  color: string;
  width: number;
  opacity: number;
  tool: ToolKind;
};

export const SKETCH_COLORS = [
  '#000000', '#FFFFFF', '#6B7280', '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#92400E',
];

export const BRUSH_SIZES = [1, 2, 4, 6, 10, 16, 24, 32, 48, 64];

export function createSketchDocument(width = 1024, height = 1024, background = '#FFFFFF'): SketchDocument {
  return { version: 2, width, height, background, strokes: [] };
}

export function createStroke(
  points: Point[],
  settings: SketchSettings = { color: '#111827', width: 4, opacity: 1, tool: 'pen' },
): Stroke {
  const tool = settings.tool;
  return {
    id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    points,
    color: tool === 'eraser' ? '#FFFFFF' : settings.color,
    width: Math.max(1, settings.width),
    opacity: Math.min(1, Math.max(0.05, settings.opacity)),
    tool,
  };
}

export function addStroke(document: SketchDocument, stroke: Stroke): SketchDocument {
  return { ...document, strokes: [...document.strokes, stroke] };
}

export function undoLastStroke(document: SketchDocument): SketchDocument {
  return { ...document, strokes: document.strokes.slice(0, -1) };
}

export function redoStroke(document: SketchDocument, stroke: Stroke): SketchDocument {
  return addStroke(document, stroke);
}

export function clearSketch(document: SketchDocument): SketchDocument {
  return { ...document, strokes: [] };
}

export function setBackground(document: SketchDocument, background: string): SketchDocument {
  return { ...document, background };
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&apos;');
}

function polylineMarkup(stroke: Stroke): string {
  if (stroke.points.length < 2) return '';
  const points = stroke.points.map((point) => `${point.x},${point.y}`).join(' ');
  const dash = stroke.tool === 'pencil' ? ' stroke-dasharray="2 1"' : '';
  const blur = stroke.tool === 'brush' ? ' filter="url(#soft)"' : '';
  const fill = stroke.fill ? ` fill="${escapeXml(stroke.fill)}"` : ' fill="none"';
  return `<polyline points="${points}"${fill} stroke="${escapeXml(stroke.color)}" stroke-opacity="${stroke.opacity}" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round"${dash}${blur} />`;
}

export function sketchToSvg(document: SketchDocument): string {
  const strokeMarkup = document.strokes.map(polylineMarkup).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}"><defs><filter id="soft"><feGaussianBlur stdDeviation="1.2" /></filter></defs><rect width="100%" height="100%" fill="${escapeXml(document.background)}"/>${strokeMarkup}</svg>`;
}
