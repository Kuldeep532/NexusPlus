import AsyncStorage from '@react-native-async-storage/async-storage';
import { callGateway, discoverGatewayEndpoints } from '@/features/api-gateway/apiGatewayClient';
import { eraSystemPrompt, isSpiritualEraQuestion } from './eraAiGuard';
import type { EraLanguage, EraResponse, EraHabitSignal, EraRecommendation } from './eraAiTypes';

const HABIT_KEY = '@nexus-plus/era-ai/habits.v1';
const HISTORY_KEY = '@nexus-plus/era-ai/history.v1';
const QA_ASSET_HINTS = [
  'life', 'problem', 'trouble', 'stress', 'anxiety', 'anger', 'purpose', 'career',
  'relationship', 'family', 'parent', 'student', 'failure', 'success', 'grief',
  'दुःख', 'चिंता', 'तनाव', 'क्रोध', 'जीवन', 'समस्या', 'करियर', 'रिश्ता', 'परिवार',
];

function detectSignals(text: string): EraHabitSignal[] {
  const lower = text.toLowerCase();
  const rules = [
    { id: 'stress', label: 'Stress and worry', description: 'Frequent questions about stress, worry or pressure.', terms: ['stress', 'worry', 'anxiety', 'चिंता', 'तनाव', 'परेशान'] },
    { id: 'anger', label: 'Anger control', description: 'Repeated concern about anger or reactions.', terms: ['anger', 'angry', 'क्रोध', 'गुस्सा'] },
    { id: 'consistency', label: 'Daily consistency', description: 'Repeated focus on routines, discipline or consistency.', terms: ['habit', 'discipline', 'routine', 'consistent', 'आदत', 'अनुशासन', 'नियमित'] },
    { id: 'sadness', label: 'Emotional heaviness', description: 'Repeated sadness, loneliness or discouragement.', terms: ['sad', 'lonely', 'hopeless', 'दुःख', 'अकेला', 'निराश'] },
  ];
  return rules.filter((rule) => rule.terms.some((term) => lower.includes(term))).map((rule) => ({
    id: rule.id, label: rule.label, description: rule.description, count: 1, lastSeenAt: Date.now(),
  }));
}

async function updateHabits(text: string): Promise<EraHabitSignal[]> {
  const signals = detectSignals(text);
  let existing: EraHabitSignal[] = [];
  try {
    existing = JSON.parse(await AsyncStorage.getItem(HABIT_KEY) || '[]') as EraHabitSignal[];
  } catch {}
  const map = new Map(existing.map((item) => [item.id, item]));
  for (const signal of signals) {
    const old = map.get(signal.id);
    map.set(signal.id, { ...signal, count: (old?.count ?? 0) + 1 });
  }
  const next = [...map.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  await AsyncStorage.setItem(HABIT_KEY, JSON.stringify(next));
  return next;
}

function makeRecommendations(habits: EraHabitSignal[]): EraRecommendation[] {
  const top = habits[0];
  if (!top) return [];
  if (top.id === 'stress') return [{ id: 'stress-gita', title: 'शांति के लिए गीता', body: 'आज कुछ मिनट शांत होकर गीता का एक श्लोक पढ़ें।', action: 'open-gita', chapter: 2, verse: 47 }];
  if (top.id === 'anger') return [{ id: 'anger-gita', title: 'क्रोध पर चिंतन', body: 'अध्याय 2 का एक संबंधित श्लोक पढ़कर प्रतिक्रिया से पहले ठहरें।', action: 'open-gita', chapter: 2, verse: 63 }];
  if (top.id === 'consistency') return [{ id: 'consistency-reminder', title: 'दैनिक साधना', body: 'आज 5 मिनट का छोटा आध्यात्मिक अभ्यास तय करें।', action: 'reminder', reminderText: 'Era AI: 5 मिनट शांत ध्यान या गीता पाठ का समय।' }];
  return [{ id: 'reflection', title: 'आज का चिंतन', body: 'कुछ मिनट मौन में बैठकर अपने विचारों को देखें।', action: 'reminder', reminderText: 'Era AI: आज कुछ मिनट आत्म-चिंतन के लिए रुकें।' }];
}

async function callEraProvider(message: string, language: EraLanguage, context?: string): Promise<string | null> {
  const endpoints = await discoverGatewayEndpoints();
  const ranked = endpoints.map((endpoint) => {
    const haystack = `${endpoint.id} ${endpoint.path} ${endpoint.feature ?? ''} ${endpoint.description ?? ''}`.toLowerCase();
    let score = 0;
    if (haystack.includes('openai') || haystack.includes('gemini')) score += 4;
    if (haystack.includes('chat') || haystack.includes('response') || haystack.includes('generate')) score += 3;
    return { endpoint, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  const endpoint = ranked[0]?.endpoint;
  if (!endpoint) return null;

  const prompt = [
    eraSystemPrompt(language),
    'Use the supplied spiritual Q&A examples as inspiration only. Never copy an example verbatim.',
    'Generate a fresh response each time. Rephrase, expand or shorten naturally based on the user\'s exact situation.',
    'Ground advice in broad Bhagavad Gita principles when relevant, but do not fabricate verse quotations.',
    'A useful answer should usually contain: acknowledgement, spiritual perspective, 2-4 practical steps, and one reflective question.',
    `Language: ${language === 'hi' ? 'Hindi' : 'English'}`,
    `User question: ${message}`,
    `Relevant Q&A asset themes: ${QA_ASSET_HINTS.join(', ')}`,
    `Gita context: ${context || 'none'}`,
  ].join('\\n\\n');

  const payload = await callGateway<any>(endpoint.path, {
    method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: {
      model: endpoint.id || undefined,
      messages: [
        { role: 'system', content: eraSystemPrompt(language) },
        { role: 'user', content: prompt },
      ],
      input: prompt,
      prompt,
      generationConfig: { temperature: 0.85, topP: 0.9, maxOutputTokens: 800 },
      max_tokens: 800,
    },
  });
  const text = payload?.choices?.[0]?.message?.content
    ?? payload?.output_text
    ?? payload?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text).filter(Boolean).join('')
    ?? payload?.text
    ?? payload?.response?.text;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

export async function askEraAI(input: {
  message: string;
  language: EraLanguage;
  gitaContext?: { chapter: number; verse: number; text?: string };
}): Promise<EraResponse> {
  if (!isSpiritualEraQuestion(input.message)) {
    const text = input.language === 'hi'
      ? 'मैं केवल आध्यात्मिक, गीता, ध्यान, जीवन-चिंतन और आदत सुधार से जुड़े प्रश्नों में सहायता करता हूँ। सामान्य काम के लिए Nexus Assistant का उपयोग करें।'
      : 'I only help with spiritual, Bhagavad Gita, meditation, reflective life-guidance, and habit-improvement questions. Use Nexus Assistant for general tasks.';
    return { text, language: input.language, allowed: true };
  }
  const habits = await updateHabits(input.message);
  let text = await callEraProvider(
    input.message,
    input.language,
    input.gitaContext ? `Bhagavad Gita chapter ${input.gitaContext.chapter}, verse ${input.gitaContext.verse}: ${input.gitaContext.text || ''}` : undefined,
  );
  if (!text) {
    text = input.language === 'hi'
      ? 'पहले मन को थोड़ा शांत करें और अपने नियंत्रण में आने वाले एक छोटे कर्म से शुरुआत करें। आज केवल एक स्पष्ट कदम चुनें और उसे बिना परिणाम की चिंता के पूरा करने पर ध्यान दें।'
      : 'First calm the mind and choose one small action within your control. Focus on completing that step with sincerity rather than worrying about the final outcome.';
  }
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify({ lastQuestion: input.message, updatedAt: Date.now() }));
  return { text, language: input.language, allowed: true, suggestions: makeRecommendations(habits) };
}

export async function getEraHabitRecommendations(): Promise<EraRecommendation[]> {
  try {
    const habits = JSON.parse(await AsyncStorage.getItem(HABIT_KEY) || '[]') as EraHabitSignal[];
    return makeRecommendations(habits);
  } catch {
    return [];
  }
}
