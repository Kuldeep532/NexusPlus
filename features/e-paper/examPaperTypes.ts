export type ExamPaperMode = 'manual' | 'automatic';
export type ExamPaperLevel = 'school-1-5' | 'school-6-8' | 'school-9-10' | 'school-11-12' | 'undergraduate' | 'postgraduate' | 'net-pg' | 'upsc' | 'competitive' | 'custom';

export type ExamSubject = {
  id: string;
  name: string;
  levels: ExamPaperLevel[];
  topics: string[];
};

export type ExamQuestion = {
  id: string;
  type: 'mcq' | 'short' | 'long' | 'true-false' | 'fill' | 'case-study';
  question: string;
  options?: string[];
  answer?: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
};

export type ExamPaperSpec = {
  title: string;
  subjectId: string;
  level: ExamPaperLevel;
  mode: ExamPaperMode;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  sections: Array<{ name: string; questionType: ExamQuestion['type']; count: number; marksEach: number }>;
  seed: string;
};

export type ExamTimeLock = {
  unlockAt: string;
  printFrom?: string;
  expiresAt?: string;
  keyVersion: 1;
  algorithm: 'AES-256-GCM';
  policy: 'device-time-and-token' | 'trusted-time-token';
};
