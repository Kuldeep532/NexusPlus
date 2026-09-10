import type { ExamQuestion } from './examPaperTypes';
import type { EPaperDocument } from './ePaperTypes';

export type EPaperMode = 'general' | 'exam';

const EXAM_HINTS = [
  /\bquestion\b/i,
  /\banswer\b/i,
  /\bmarks?\b/i,
  /\bmcq\b/i,
  /\bmultiple\s+choice\b/i,
  /\bchoose\s+(the\s+)?correct\b/i,
  /\bfill\s+in\s+the\s+blanks?\b/i,
  /\btrue\s*(?:or|and)\s*false\b/i,
  /\bshort\s+answer\b/i,
  /\blong\s+answer\b/i,
  /\bsection\s*[a-z0-9]\b/i,
  /\btotal\s+marks?\b/i,
  /\btime\s+allowed\b/i,
];

export function looksLikeExamContent(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return false;
  const hits = EXAM_HINTS.reduce((count, pattern) => count + (pattern.test(normalized) ? 1 : 0), 0);
  return hits >= 2;
}

export function hasExamQuestionShape(question: Pick<ExamQuestion, 'question' | 'options' | 'answer' | 'marks' | 'type'>): boolean {
  return Boolean(question.question?.trim()) && Boolean(question.type) && Number.isFinite(question.marks);
}

export function assertGeneralEPaperContent(text: string): void {
  if (looksLikeExamContent(text)) {
    throw new Error('Question-answer style content belongs in the Exam E-Paper tab. General E-Paper accepts article/editorial content only.');
  }
}

export function documentMode(doc: EPaperDocument): EPaperMode {
  const title = `${doc.title} ${doc.publisher}`;
  return looksLikeExamContent(title) ? 'exam' : 'general';
}
