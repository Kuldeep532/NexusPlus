import type { ToolKind } from './sketchEngine';

export type PainterTool = {
  tool: ToolKind;
  label: string;
  description: string;
};

export const PAINTER_TOOLS: PainterTool[] = [
  { tool: 'pen', label: 'Pen', description: 'Clean freehand strokes.' },
  { tool: 'pencil', label: 'Pencil', description: 'Light sketch texture.' },
  { tool: 'marker', label: 'Marker', description: 'Bold opaque drawing.' },
  { tool: 'brush', label: 'Brush', description: 'Soft brush strokes.' },
  { tool: 'highlighter', label: 'Highlighter', description: 'Transparent broad strokes.' },
  { tool: 'eraser', label: 'Eraser', description: 'Erase by painting over marks.' },
  { tool: 'line', label: 'Line', description: 'Straight line tool.' },
  { tool: 'rectangle', label: 'Rectangle', description: 'Draw outlined rectangles.' },
  { tool: 'ellipse', label: 'Ellipse', description: 'Draw outlined circles and ellipses.' },
  { tool: 'arrow', label: 'Arrow', description: 'Draw directional arrows.' },
];

export const DEFAULT_PAINTER_SETTINGS = {
  color: '#111827',
  width: 4,
  opacity: 1,
  tool: 'pen' as ToolKind,
};
