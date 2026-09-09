export type Point = { x: number; y: number };
export type ToolKind = 'pen' | 'pencil' | 'marker' | 'highlighter' | 'brush' | 'airbrush' | 'crayon' | 'charcoal' | 'eraser' | 'line' | 'rectangle' | 'ellipse' | 'arrow' | 'fill';
export type Stroke = { id: string; tool: ToolKind; points: Point[]; color: string; width: number; opacity: number; fill?: string };
export type SketchDocument = { version: 3; width: number; height: number; background: string; strokes: Stroke[] };

export const COLOR_FAMILIES = [
  { name: 'Black & White', shades: ['#000000','#1F2937','#4B5563','#9CA3AF','#D1D5DB','#F3F4F6','#FFFFFF'] },
  { name: 'Red', shades: ['#450A0A','#7F1D1D','#991B1B','#DC2626','#EF4444','#F87171','#FCA5A5','#FECACA'] },
  { name: 'Orange', shades: ['#431407','#7C2D12','#C2410C','#EA580C','#F97316','#FB923C','#FDBA74','#FED7AA'] },
  { name: 'Saffron', shades: ['#4A1D05','#78350F','#B45309','#D97706','#F59E0B','#FBBF24','#FCD34D','#FDE68A'] },
  { name: 'Yellow', shades: ['#422006','#713F12','#A16207','#CA8A04','#EAB308','#FACC15','#FDE047','#FEF08A'] },
  { name: 'Gold', shades: ['#422006','#713F12','#92400E','#A16207','#B45309','#D97706','#F59E0B','#FBBF24','#FDE68A'] },
  { name: 'Green', shades: ['#052E16','#14532D','#166534','#15803D','#16A34A','#22C55E','#4ADE80','#86EFAC','#BBF7D0'] },
  { name: 'Teal', shades: ['#042F2E','#134E4A','#115E59','#0F766E','#0D9488','#14B8A6','#2DD4BF','#5EEAD4','#99F6E4'] },
  { name: 'Cyan', shades: ['#083344','#164E63','#155E75','#0E7490','#0891B2','#06B6D4','#22D3EE','#67E8F9','#A5F3FC'] },
  { name: 'Blue', shades: ['#172554','#1E3A8A','#1D4ED8','#2563EB','#3B82F6','#60A5FA','#93C5FD','#BFDBFE'] },
  { name: 'Deep Blue', shades: ['#020617','#0F172A','#172554','#1E3A8A','#1E40AF','#1D4ED8','#2563EB','#3B82F6'] },
  { name: 'Purple', shades: ['#2E1065','#4C1D95','#5B21B6','#6D28D9','#7C3AED','#8B5CF6','#A78BFA','#C4B5FD'] },
  { name: 'Violet', shades: ['#1E1B4B','#312E81','#4338CA','#4F46E5','#6366F1','#818CF8','#A5B4FC','#C7D2FE'] },
  { name: 'Pink', shades: ['#500724','#831843','#9D174D','#BE185D','#DB2777','#EC4899','#F472B6','#F9A8D4'] },
  { name: 'Brown', shades: ['#29130A','#451A03','#78350F','#92400E','#A16207','#B45309','#D97706','#F59E0B'] },
];
export const BRUSH_SIZES = [1,2,4,6,10,16,24,32,48,64,96];
export const OPACITIES = [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1];
export function createSketchDocument(width=1024,height=1024,background='#FFFFFF'): SketchDocument { return { version:3,width,height,background,strokes:[] }; }
export function createStroke(points:Point[],settings:{color:string;width:number;opacity:number;tool:ToolKind}):Stroke { return { id:`stroke-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,points,color:settings.color,width:Math.max(1,settings.width),opacity:Math.min(1,Math.max(.05,settings.opacity)),tool:settings.tool }; }
export function addStroke(document:SketchDocument,stroke:Stroke):SketchDocument { return {...document,strokes:[...document.strokes,stroke]}; }
export function undoLastStroke(document:SketchDocument):SketchDocument { return {...document,strokes:document.strokes.slice(0,-1)}; }
export function clearSketch(document:SketchDocument):SketchDocument { return {...document,strokes:[]}; }
export function setBackground(document:SketchDocument,background:string):SketchDocument { return {...document,background}; }
function escapeXml(value:string):string{return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
export function sketchToSvg(document:SketchDocument):string { const markup=document.strokes.filter(s=>s.tool!=='fill'&&s.points.length>1).map(s=>`<polyline points="${s.points.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="${escapeXml(s.color)}" stroke-opacity="${s.opacity}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round" />`).join(''); return `<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}"><rect width="100%" height="100%" fill="${escapeXml(document.background)}"/>${markup}</svg>`; }
