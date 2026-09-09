import type { EPaperDocument, EPaperElement, EPaperImageElement, EPaperPage, EPaperTextElement } from './ePaperTypes';
import { getPaperPoints } from './ePaperTypes';

const id = (prefix: string, index: number) => `${prefix}-${Date.now().toString(36)}-${index}`;

function columnX(index: number, pageWidth: number, margin: number, columns: number, gutter: number) {
  const inner = pageWidth - margin * 2;
  const columnWidth = (inner - gutter * (columns - 1)) / columns;
  return margin + index * (columnWidth + gutter);
}

function columnWidth(pageWidth: number, margin: number, columns: number, gutter: number) {
  return (pageWidth - margin * 2 - gutter * (columns - 1)) / columns;
}

function makeText(type: EPaperTextElement['type'], text: string, x: number, y: number, width: number, height: number, fontSize: number, fontWeight: EPaperTextElement['fontWeight']): EPaperTextElement {
  return { id: id(type, Math.round(y)), type, text, x, y, width, height, fontSize, fontWeight, lineHeight: Math.round(fontSize * 1.25), align: 'left' };
}

export function createEmptyDocument(): EPaperDocument {
  return {
    version: 1,
    title: 'My E-Paper',
    publisher: 'Nexus Plus',
    editionDate: new Date().toLocaleDateString(),
    paperSize: 'a4',
    orientation: 'portrait',
    columns: 3,
    gutter: 14,
    margin: 28,
    background: '#FFFFFF',
    ink: '#111111',
    accent: '#1F4D7A',
    pages: [{ id: id('page', 0), elements: [] }],
  };
}

export type GenerateInput = { title: string; intro?: string; sections: { heading?: string; body: string; image?: EPaperImageElement }[] };

export function generateEPaperLayout(doc: EPaperDocument, input: GenerateInput): EPaperDocument {
  const paper = getPaperPoints(doc);
  const width = paper.width;
  const height = paper.height;
  const cw = columnWidth(width, doc.margin, doc.columns, doc.gutter);
  const pages: EPaperPage[] = [];
  let page: EPaperPage = { id: id('page', pages.length), elements: [] };
  let currentColumn = 0;
  let y = doc.margin;

  const newPage = () => {
    pages.push(page);
    page = { id: id('page', pages.length), elements: [] };
    currentColumn = 0;
    y = doc.margin;
  };
  const nextColumn = () => {
    currentColumn += 1;
    if (currentColumn >= doc.columns) newPage();
    else y = doc.margin;
  };

  const place = (element: EPaperElement) => {
    const bottom = element.y + element.height;
    if (bottom > height - doc.margin) {
      nextColumn();
      element.x = columnX(currentColumn, width, doc.margin, doc.columns, doc.gutter);
      element.y = y;
    }
    page.elements.push(element);
    y = element.y + element.height + 10;
  };

  const titleW = width - doc.margin * 2;
  place(makeText('headline', input.title || doc.title, doc.margin, y, titleW, 55, 30, '800'));
  if (input.intro) place(makeText('subheadline', input.intro, doc.margin, y, titleW, 48, 15, '600'));
  if (input.sections.length) {
    const hero = input.sections[0];
    if (hero.heading) place(makeText('subheadline', hero.heading, columnX(currentColumn, width, doc.margin, doc.columns, doc.gutter), y, cw, 32, 18, '700'));
    place(makeText('body', hero.body, columnX(currentColumn, width, doc.margin, doc.columns, doc.gutter), y, cw, Math.min(180, Math.max(80, Math.ceil(hero.body.length / 2.8))), 11, '400'));
    if (hero.image) {
      const image: EPaperImageElement = { ...hero.image, x: columnX(currentColumn, width, doc.margin, doc.columns, doc.gutter), y, width: cw, height: 135 };
      place(image);
    }
  }
  input.sections.slice(1).forEach((section, index) => {
    if (section.heading) place(makeText('subheadline', section.heading, columnX(currentColumn, width, doc.margin, doc.columns, doc.gutter), y, cw, 28, 15, '700'));
    place(makeText('body', section.body, columnX(currentColumn, width, doc.margin, doc.columns, doc.gutter), y, cw, Math.min(230, Math.max(70, Math.ceil(section.body.length / 3.4))), 10.5, '400'));
    if (section.image) {
      place({ ...section.image, x: columnX(currentColumn, width, doc.margin, doc.columns, doc.gutter), y, width: cw, height: 120 });
    }
    if (index % 3 === 2) nextColumn();
  });
  if (page.elements.length) pages.push(page);
  return { ...doc, title: input.title || doc.title, pages };
}

export function normalizeForPreview(doc: EPaperDocument, viewportWidth: number) {
  const paper = getPaperPoints(doc);
  const scale = Math.min(1, viewportWidth / paper.width);
  return { width: paper.width * scale, height: paper.height * scale, scale };
}
