import { EPaperTextElement } from './ePaperTypes';

export type HumanizedStory = { title: string; body: string; changed: boolean; reason: string };

const SENTENCE_SPLIT = /(?<=[.!?।])\s+/u;
const FILLERS = [
  /\bvery\s+/gi,
  /\bperhaps\s+/gi,
  /\bit is important to note that\s+/gi,
  /\bin conclusion[,:]?\s*/gi,
  /\bneedless to say[,:]?\s*/gi,
  /\bmoreover[,:]?\s*/gi,
];

function cleanWhitespace(value: string): string {
  return value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function polishSentence(sentence: string): string {
  let next = sentence.trim().replace(/\s+([,.;:!?।])/g, '$1');
  for (const pattern of FILLERS) next = next.replace(pattern, '');
  return next.replace(/^([a-z])/, (m) => m.toUpperCase());
}

function deterministicSummary(body: string, maxSentences = 5): string {
  const sentences = cleanWhitespace(body).split(SENTENCE_SPLIT).map(polishSentence).filter(Boolean);
  if (sentences.length <= maxSentences) return sentences.join(' ');
  const ranked = sentences
    .map((text, index) => ({ text, index, score: Math.min(1, text.length / 180) + (index === 0 ? 0.45 : 0) + (text.length > 80 ? 0.2 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.text);
  return ranked.join(' ');
}

export function humanOptimizeStory(title: string, body: string): HumanizedStory {
  const normalizedTitle = cleanWhitespace(title) || 'Untitled Story';
  const normalizedBody = cleanWhitespace(body);
  const polished = deterministicSummary(normalizedBody);
  const changed = polished !== normalizedBody || normalizedTitle !== title.trim();
  return {
    title: normalizedTitle,
    body: polished,
    changed,
    reason: changed ? 'Language cleaned and long passages condensed deterministically.' : 'Content already fits the local editorial rules.',
  };
}

export function humanOptimizeHeadline(text: string): string {
  const normalized = cleanWhitespace(text).replace(/["“”]+/g, '');
  if (!normalized) return 'Nexus Plus E-Paper';
  const sentence = normalized.split(/[.!?।]/u)[0].trim();
  return sentence.slice(0, 92).trim() || 'Nexus Plus E-Paper';
}

export function humanOptimizeTextElement(element: EPaperTextElement): EPaperTextElement {
  const result = humanOptimizeStory('', element.text);
  return { ...element, text: result.body };
}
