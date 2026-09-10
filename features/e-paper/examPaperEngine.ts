import type { ExamQuestion, ExamPaperSpec } from './examPaperTypes';
import { generatePatternQuestions, subjectById } from './examQuestionBank';

export function buildExamPaper(spec: ExamPaperSpec, sourceQuestions: ExamQuestion[]): ExamQuestion[] {
  const subject = subjectById(spec.subjectId);
  if (!subject) throw new Error('Select a valid exam subject.');
  if (!subject.levels.includes(spec.level)) throw new Error(`The selected subject is not mapped to ${spec.level}.`);
  if (!sourceQuestions.length) throw new Error('Automatic generation requires an imported or verified question bank.');
  const questions = generatePatternQuestions(spec, sourceQuestions);
  if (!questions.length) throw new Error('No questions matched the selected exam pattern.');
  return questions;
}

export function validateExamTiming(unlockAt: string, printFrom: string, expiresAt?: string): void {
  const unlock = Date.parse(unlockAt);
  const print = Date.parse(printFrom);
  if (!Number.isFinite(unlock) || !Number.isFinite(print)) throw new Error('Exam unlock and print times must be valid dates.');
  if (print < unlock) throw new Error('Print time cannot be earlier than unlock time.');
  if (expiresAt) {
    const expiry = Date.parse(expiresAt);
    if (!Number.isFinite(expiry) || expiry < print) throw new Error('Expiry must be after the print time.');
  }
}

export function estimateMarks(questions: ExamQuestion[]): number { return questions.reduce((total, question) => total + Math.max(0, question.marks), 0); }
