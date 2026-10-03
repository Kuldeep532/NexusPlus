import { loadCachedVerseBundle } from '@/features/geeta-nexus/geetaStage5Repository';
import { searchGitaVerses } from '@/features/geeta-nexus/geetaStage5Search';
import { GITA_CHAPTERS } from '@/features/geeta-nexus/geetaTypes';
import { getLocalInferenceEngine } from '@/features/nexus-assistant/localInference';
import { downloadAssistantModel, getAssistantModelPath } from '@/features/nexus-assistant/modelManager';
import { NEXUS_CORE_MODEL_ID } from '@/features/nexus-assistant/assistantConfig';
import type { EraLanguage } from './eraAiTypes';

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim();
}

function inferChapter(question: string): number | null {
  const value = normalize(question);
  const signals: Array<[number, string[]]> = [
    [2, ['karma', 'कर्म', 'mind', 'मन', 'duty', 'कर्तव्य']],
    [3, ['work', 'कार्य', 'कर्तव्य', 'karma yoga', 'कर्मयोग']],
    [6, ['meditation', 'ध्यान', 'mind control', 'मन संयम', 'yoga']],
    [12, ['devotion', 'भक्ति', 'भक्त']],
    [16, ['anger', 'क्रोध', 'दैवी', 'आसुरी']],
    [18, ['liberation', 'मोक्ष', 'त्याग', 'मुक्ति']],
  ];
  let best: { chapter: number; score: number } | null = null;
  for (const [chapter, terms] of signals) {
    const score = terms.reduce((n, term) => n + (value.includes(normalize(term)) ? 1 : 0), 0);
    if (!best || score > best.score) best = { chapter, score };
  }
  return best && best.score > 0 ? best.chapter : null;
}

async function getVerifiedGitaContext(question: string, explicitContext?: string): Promise<string> {
  const bundle = await loadCachedVerseBundle();
  if (!bundle?.verses?.length) return explicitContext || '';
  const direct = searchGitaVerses(bundle.verses, question, 4);
  const chapter = inferChapter(question);
  const chapterMatches = chapter ? bundle.verses.filter((verse) => verse.chapter === chapter).slice(0, 6) : [];
  const verses = direct.length ? direct : chapterMatches;
  if (!verses.length) return explicitContext || '';

  return verses.map((verse) => {
    const title = GITA_CHAPTERS[verse.chapter - 1]?.nameEnglish || `Chapter ${verse.chapter}`;
    return [
      `Bhagavad Gita — ${title} — Chapter ${verse.chapter}, Verse ${verse.verse}`,
      verse.sanskrit,
      verse.translationHindi || '',
      verse.translationEnglish || '',
      verse.meaningHindi || '',
    ].filter(Boolean).join(' — ');
  }).join('\n');
}

export async function generateAiraLocally(input: {
  message: string;
  language: EraLanguage;
  gitaContext?: string;
  sourceContext?: string;
}): Promise<string | null> {
  try {
    let modelPath = getAssistantModelPath(NEXUS_CORE_MODEL_ID);
    if (!modelPath) {
      await downloadAssistantModel(NEXUS_CORE_MODEL_ID);
      modelPath = getAssistantModelPath(NEXUS_CORE_MODEL_ID);
    }
    if (!modelPath) return null;

    const engine = await getLocalInferenceEngine();
    if (!(await engine.isAvailable())) return null;

    const verifiedGita = await getVerifiedGitaContext(input.message, input.gitaContext);
    let output = '';
    await engine.loadModel(modelPath, NEXUS_CORE_MODEL_ID);
    try {
      await engine.stream(
        [
          {
            role: 'system',
            content: [
              'You are Aira, the spiritual guidance assistant inside Nexus Plus.',
              'Answer only spiritual, Bhagavad Gita, reflection, meditation, dharma, karma, habit-improvement and personal-growth questions.',
              'Use the verified Gita context when relevant. Do not invent quotations, chapter numbers, verse numbers, or scripture claims.',
              'Use the editable spiritual source context only as reference material; never pretend it is scripture.',
              'Answer in the requested language. Keep the response practical, compassionate and accessible.',
            ].join(' '),
          },
          {
            role: 'user',
            content: [
              `Language: ${input.language === 'hi' ? 'Hindi' : 'English'}`,
              `Question: ${input.message}`,
              `Verified Gita context:\n${verifiedGita || 'None available offline.'}`,
              `Editable spiritual source:\n${input.sourceContext || 'None.'}`,
            ].join('\n\n'),
          },
        ],
        { modelId: NEXUS_CORE_MODEL_ID, maxTokens: 220, temperature: 0.45, contextSize: 1536 },
        (chunk) => {
          if (chunk.type === 'token') output += chunk.text;
        },
      );
    } finally {
      await engine.unloadModel();
    }
    return output.trim() || null;
  } catch {
    return null;
  }
}
