import type { EPaperDocument } from './ePaperTypes';
import { getPaperPoints } from './ePaperTypes';

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function renderEPaperPageToSvg(doc: EPaperDocument, pageIndex: number): string {
  const paper = getPaperPoints(doc);
  const page = doc.pages[pageIndex];
  const content = page.elements.map((element) => {
    if (element.type === 'image') {
      return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="4" fill="#E4E4E4"/><text x="${element.x + 6}" y="${element.y + Math.min(18, element.height / 2)}" font-size="9" fill="#666">${escapeXml(element.name)}</text>`;
    }
    if (element.type === 'divider') return `<line x1="${element.x}" y1="${element.y}" x2="${element.x + element.width}" y2="${element.y}" stroke="${doc.ink}" stroke-width="1"/>`;
    if (element.type === 'spacer') return '';
    const text = escapeXml(element.text).replace(/\n/g, ' ');
    return `<text x="${element.x}" y="${element.y + element.fontSize}" font-size="${element.fontSize}" font-family="Arial, sans-serif" font-weight="${element.fontWeight}" text-anchor="${element.align === 'center' ? 'middle' : element.align === 'right' ? 'end' : 'start'}" fill="${doc.ink}">${text}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${paper.width}pt" height="${paper.height}pt" viewBox="0 0 ${paper.width} ${paper.height}"><rect width="100%" height="100%" fill="${doc.background}"/>${content}</svg>`;
}
