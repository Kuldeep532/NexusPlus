import { callGateway, discoverGatewayEndpoints } from '@/features/api-gateway/apiGatewayClient';

export type EPaperAiAction =
  | 'summarize'
  | 'improve'
  | 'advanced-rewrite'
  | 'headline-polish'
  | 'exam-paper'
  | 'news-edition';

type Language = 'hi' | 'en';

function extractText(payload: any): string | null {
  const text = payload?.choices?.[0]?.message?.content
    ?? payload?.output_text
    ?? payload?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text).filter(Boolean).join('')
    ?? payload?.text
    ?? payload?.response?.text;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

async function resolveEndpoint(): Promise<{ path:string; method:'GET'|'POST'|'PUT'|'PATCH'|'DELETE'; model?:string } | null> {
  const endpoints = await discoverGatewayEndpoints();
  const ranked = endpoints.map((endpoint) => {
    const haystack = `${endpoint.id} ${endpoint.path} ${endpoint.feature ?? ''} ${endpoint.description ?? ''}`.toLowerCase();
    let score = 0;
    if (haystack.includes('openai') || haystack.includes('gemini') || haystack.includes('anthropic')) score += 4;
    if (haystack.includes('chat') || haystack.includes('response') || haystack.includes('generate')) score += 3;
    return { endpoint, score };
  }).filter((item) => item.score > 0).sort((a,b) => b.score-a.score);
  const endpoint = ranked[0]?.endpoint;
  if (!endpoint) return null;
  return { path:endpoint.path, method:endpoint.method as any, model:endpoint.id };
}

function promptFor(action: EPaperAiAction, text: string, language: Language): string {
  const lang = language === 'hi' ? 'Hindi' : 'English';
  const task: Record<EPaperAiAction,string> = {
    summarize: 'Create a concise factual summary that preserves the key points.',
    improve: 'Improve grammar, clarity and readability without changing meaning.',
    'advanced-rewrite': 'Rewrite this as polished publication-ready copy with stronger structure, flow, and clarity while preserving facts.',
    'headline-polish': 'Create a strong, clear newspaper headline and a short subheadline. Do not invent facts.',
    'exam-paper': 'Turn the supplied material into a structured exam paper with title, instructions, sections and balanced questions. Do not invent syllabus-specific facts that are absent.',
    'news-edition': 'Turn the supplied material into a coherent newspaper-style edition with a lead story, supporting stories, headlines, and short summaries. Preserve supplied facts and avoid fabricated details.',
  };
  return [
    `Language: ${lang}`,
    `Task: ${task[action]}`,
    'Return only the finished content, with no developer notes or internal labels.',
    'Source material:',
    text,
  ].join('\\n\\n');
}

export async function runEPaperAi(input: {
  action: EPaperAiAction;
  text: string;
  language?: Language;
}): Promise<string> {
  const text = input.text.trim();
  if (!text) throw new Error('Add some content first.');
  const endpoint = await resolveEndpoint();
  if (!endpoint) throw new Error('AI service is unavailable right now.');
  const prompt = promptFor(input.action, text, input.language ?? 'en');
  const payload = await callGateway<any>(endpoint.path, {
    method: endpoint.method,
    body: {
      model: endpoint.model,
      messages: [
        { role:'system', content:'You are a careful publishing assistant. Keep facts grounded in the supplied text.' },
        { role:'user', content:prompt },
      ],
      input: prompt,
      prompt,
      generationConfig: { temperature: 0.4, topP: 0.9, maxOutputTokens: 1200 },
      max_tokens: 1200,
    },
  });
  const result = extractText(payload);
  if (!result) throw new Error('The AI could not generate a result right now.');
  return result;
}
