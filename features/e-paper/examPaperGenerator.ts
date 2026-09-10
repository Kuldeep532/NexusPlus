import type { ExamPaperSpec, ExamQuestion } from './examPaperTypes';
import { generatePatternQuestions, subjectById } from './examQuestionBank';

export type ExamPaperResult = {
  title: string;
  subject: string;
  level: string;
  questions: ExamQuestion[];
  totalMarks: number;
  sourceCount: number;
};

export function generateExamPaper(spec: ExamPaperSpec, sourceQuestions: ExamQuestion[]): ExamPaperResult {
  if (!subjectById(spec.subjectId)) throw new Error('Unknown exam subject.');
  if (!Number.isInteger(spec.questionCount) || spec.questionCount < 1 || spec.questionCount > 500) throw new Error('Question count must be between 1 and 500.');
  if (!Number.isInteger(spec.durationMinutes) || spec.durationMinutes < 1) throw new Error('Exam duration must be at least 1 minute.');
  const questions = generatePatternQuestions(spec, sourceQuestions);
  if (!questions.length) throw new Error('No verified source questions are available for the selected exam pattern. Import a question bank first.');
  const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
  return {
    title: spec.title.trim() || `${subjectById(spec.subjectId)?.name ?? 'Exam'} Paper`,
    subject: subjectById(spec.subjectId)?.name ?? spec.subjectId,
    level: spec.level,
    questions,
    totalMarks,
    sourceCount: sourceQuestions.length,
  };
}
