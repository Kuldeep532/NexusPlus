import type { ExamPaperLevel, ExamQuestion, ExamPaperSpec, ExamSubject } from './examPaperTypes';

export const EXAM_SUBJECTS: ExamSubject[] = [
  { id: 'mathematics', name: 'Mathematics', levels: ['school-1-5','school-6-8','school-9-10','school-11-12','undergraduate','postgraduate','competitive'], topics: ['number systems','algebra','geometry','trigonometry','calculus','statistics','probability'] },
  { id: 'science', name: 'Science', levels: ['school-1-5','school-6-8','school-9-10'], topics: ['matter','motion','energy','life processes','environment','basic chemistry'] },
  { id: 'physics', name: 'Physics', levels: ['school-9-10','school-11-12','undergraduate','postgraduate','net-pg','competitive'], topics: ['mechanics','waves','thermodynamics','electromagnetism','optics','modern physics'] },
  { id: 'chemistry', name: 'Chemistry', levels: ['school-9-10','school-11-12','undergraduate','postgraduate','net-pg','competitive'], topics: ['atomic structure','bonding','organic chemistry','inorganic chemistry','physical chemistry','electrochemistry'] },
  { id: 'biology', name: 'Biology', levels: ['school-6-8','school-9-10','school-11-12','undergraduate','postgraduate','net-pg','competitive'], topics: ['cell biology','genetics','ecology','physiology','evolution','biotechnology'] },
  { id: 'computer-science', name: 'Computer Science', levels: ['school-9-10','school-11-12','undergraduate','postgraduate','net-pg','competitive'], topics: ['programming','data structures','algorithms','databases','operating systems','networks','AI foundations'] },
  { id: 'english', name: 'English', levels: ['school-1-5','school-6-8','school-9-10','school-11-12','undergraduate','postgraduate','net-pg','competitive'], topics: ['grammar','reading comprehension','writing','literature','vocabulary'] },
  { id: 'hindi', name: 'Hindi', levels: ['school-1-5','school-6-8','school-9-10','school-11-12','undergraduate','postgraduate','competitive'], topics: ['व्याकरण','गद्य','पद्य','लेखन','साहित्य'] },
  { id: 'social-science', name: 'Social Science', levels: ['school-6-8','school-9-10'], topics: ['history','geography','civics','economics'] },
  { id: 'history', name: 'History', levels: ['school-9-10','school-11-12','undergraduate','postgraduate','net-pg','upsc','competitive'], topics: ['ancient','medieval','modern','world history','culture'] },
  { id: 'geography', name: 'Geography', levels: ['school-9-10','school-11-12','undergraduate','postgraduate','net-pg','upsc','competitive'], topics: ['physical geography','human geography','mapping','climate','resources'] },
  { id: 'political-science', name: 'Political Science', levels: ['school-11-12','undergraduate','postgraduate','net-pg','upsc','competitive'], topics: ['constitution','political theory','governance','international relations'] },
  { id: 'economics', name: 'Economics', levels: ['school-11-12','undergraduate','postgraduate','net-pg','upsc','competitive'], topics: ['microeconomics','macroeconomics','development','public finance','statistics'] },
  { id: 'commerce', name: 'Commerce', levels: ['school-11-12','undergraduate','postgraduate','net-pg','competitive'], topics: ['accounting','business studies','finance','taxation','management'] },
  { id: 'law', name: 'Law', levels: ['undergraduate','postgraduate','net-pg','competitive'], topics: ['constitutional law','criminal law','contract','tort','evidence','civil procedure'] },
  { id: 'medicine', name: 'Medicine', levels: ['undergraduate','postgraduate','net-pg','competitive'], topics: ['anatomy','physiology','pathology','pharmacology','medicine','surgery','community medicine'] },
  { id: 'engineering', name: 'Engineering', levels: ['undergraduate','postgraduate','net-pg','competitive'], topics: ['engineering mathematics','electrical','mechanical','civil','electronics','computer engineering'] },
  { id: 'management', name: 'Management', levels: ['undergraduate','postgraduate','net-pg','competitive'], topics: ['strategy','marketing','operations','finance','HR','entrepreneurship'] },
  { id: 'general-knowledge', name: 'General Knowledge', levels: ['school-6-8','school-9-10','school-11-12','competitive','upsc'], topics: ['current affairs','science','history','geography','polity','economy','culture'] },
  { id: 'upsc-general-studies', name: 'UPSC General Studies', levels: ['upsc'], topics: ['history','polity','geography','economy','environment','science','ethics'] },
  { id: 'custom', name: 'Custom Subject', levels: ['custom'], topics: [] },
];

export const EXAM_PATTERNS = {
  school: { mcq: 0.25, short: 0.35, long: 0.25, trueFalse: 0.15 },
  board: { mcq: 0.3, short: 0.3, long: 0.3, trueFalse: 0.1 },
  university: { mcq: 0.2, short: 0.35, long: 0.35, caseStudy: 0.1 },
  upsc: { mcq: 0.45, short: 0.2, long: 0.25, caseStudy: 0.1 },
  competitive: { mcq: 0.8, short: 0.1, trueFalse: 0.1 },
} as const;

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  return hash >>> 0;
}

function pick<T>(items: T[], seed: number, index: number): T {
  return items[(seed + index * 2654435761) % items.length];
}

export function generatePatternQuestions(spec: ExamPaperSpec, sourceQuestions: ExamQuestion[]): ExamQuestion[] {
  if (!sourceQuestions.length) return [];
  const seed = hashSeed(spec.seed);
  const result: ExamQuestion[] = [];
  for (let index = 0; index < spec.questionCount; index += 1) {
    const base = pick(sourceQuestions, seed, index);
    result.push({ ...base, id: `generated-${seed}-${index + 1}`, marks: Math.max(1, base.marks), difficulty: index % 5 === 0 ? 'hard' : index % 2 === 0 ? 'medium' : base.difficulty });
  }
  return result;
}

export function subjectById(id: string): ExamSubject | undefined { return EXAM_SUBJECTS.find((subject) => subject.id === id); }
