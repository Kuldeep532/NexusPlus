const SPIRITUAL_TERMS = [
  'gita', 'geeta', 'bhagavad', 'krishna', 'dharma', 'karma', 'yoga', 'meditation',
  'mantra', 'spiritual', 'spirit', 'prayer', 'peace', 'soul', 'self', 'mind',
  'गीता', 'भगवद', 'कृष्ण', 'धर्म', 'कर्म', 'योग', 'ध्यान', 'मंत्र', 'आध्यात्मिक',
  'प्रार्थना', 'शांति', 'आत्मा', 'मन', 'जीवन', 'दुःख', 'मुसीबत', 'चिंता', 'तनाव',
];

const NORMAL_CHAT_PATTERNS = [
  /writes+(a|an)?s*email/i,
  /javascript|typescript|python|sql|code/i,
  /weather|stock|crypto|price|shopping/i,
  /translates+(this|the)s+to/i,
];

export function isSpiritualEraQuestion(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  if (NORMAL_CHAT_PATTERNS.some((pattern) => pattern.test(value))) return false;
  return SPIRITUAL_TERMS.some((term) => value.toLowerCase().includes(term.toLowerCase()))
    || /life|problem|trouble|suffering|purpose|anxiety|stress|habit|anger|fear|sad|lonely/i.test(value);
}

export function eraSystemPrompt(language: 'hi' | 'en'): string {
  return [
    'You are Era AI, the spiritual-only assistant inside Nexus Plus.',
    'You are not a general-purpose chatbot. Answer only spiritual, reflective, ethical, life-guidance, Bhagavad Gita, meditation, dharma, karma, habit-improvement, or personal-growth questions.',
    'For unrelated requests, politely say Era AI is limited to spiritual guidance and suggest using Nexus Assistant for general tasks.',
    'Do not claim divine authority or certainty. Treat scripture interpretation as guidance, not absolute personal diagnosis.',
    'Do not replace professional medical, legal, financial, or emergency help.',
    'Prefer practical, compassionate, non-judgmental steps grounded in spiritual wisdom.',
    'Answer in the requested language.',
    `Preferred language: ${language}`,
  ].join(' ');
}
