export type Point = { x: number; y: number };
export type Stroke = {
  id: string;
  points: Point[];
  color: string;
  width: number;
};

export type SketchDocument = {
  version: 1;
  width: number;
  height: number;
  background: string;
  strokes: Stroke[];
};

export function createSketchDocument(width = 1024, height = 1024, background = '#FFFFFF'): SketchDocument {
  return { version: 1, width, height, background, strokes: [] };
}

export function createStroke(points: Point[], color = '#111827', width = 4): Stroke {
  return { id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, points, color, width };
}

export function addStroke(document: SketchDocument, stroke: Stroke): SketchDocument {
  return { ...document, strokes: [...document.strokes, stroke] };
}

export function undoLastStroke(document: SketchDocument): SketchDocument {
  return { ...document, strokes: document.strokes.slice(0, -1) };
}

export function clearSketch(document: SketchDocument): SketchDocument {
  return { ...document, strokes: [] };
}

export function sketchToSvg(document: SketchDocument): string {
  const strokeMarkup = document.strokes.map((stroke) => {
    if (stroke.points.length < 2) return '';
    const points = stroke.points.map((point) => `${point.x},${point.y}`).join(' ');
    return `<polyline points=\"${points}\" fill=\"none\" stroke=\"${stroke.color}\" stroke-width=\"${stroke.width}\" stroke-linecap=\"round\" stroke-linejoin=\"round\" />`;
  }).join('');
  return `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${document.width}\" height=\"${document.height}\" viewBox=\"0 0 ${document.width} ${document.height}\"><rect width=\"100%\" height=\"100%\" fill=\"${document.background}\"/>${strokeMarkup}</svg>`;
}
