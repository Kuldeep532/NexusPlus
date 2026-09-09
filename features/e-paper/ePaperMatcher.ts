import type { EPaperImageElement } from './ePaperTypes';

export type ContentChunk = {
  id: string;
  title: string;
  body: string;
  source?: 'single-paste' | 'separate-input';
};

type MatchResult = {
  score: number;
  sectionId: string;
  reasons: string[];
};

const STOP_WORDS = new Set([
  'the','and','for','with','that','this','from','into','have','has','will','are','was','were','been','about','after','before','over','under','more','than','their','there','they','them','your','you','our','his','her','its','not','but','can','all','out','who','how','what','when','where','why','a','an','of','to','in','on','at','by','is','it','as','or','be','we','i','he','she','job','jobs','news','story','article','latest',
]);

const SECTION_KEYWORDS: Record<string, string[]> = {
  accident: ['accident','crash','collision','road','highway','injured','injury','fatal','dead','vehicle','truck','car','bus','motorcycle','traffic'],
  jobs: ['job','jobs','career','vacancy','vacancies','hiring','recruitment','recruiting','employment','interview','salary','work','workforce','exam','placement'],
  business: ['business','market','company','startup','revenue','profit','loss','stock','shares','investment','economy','finance','bank'],
  sports: ['sport','sports','cricket','football','soccer','tennis','match','tournament','player','team','score','wicket','goal','medal','league'],
  technology: ['technology','tech','software','app','ai','artificial','computer','internet','cyber','device','smartphone','robot','data','digital'],
  politics: ['politics','political','election','government','minister','parliament','assembly','party','vote','president','prime','chief minister','policy'],
  education: ['education','school','college','university','student','students','exam','admission','teacher','teachers','scholarship','curriculum'],
  health: ['health','hospital','doctor','medical','medicine','disease','diseases','healthcare','patient','patients','treatment','vaccine'],
  entertainment: ['movie','film','music','actor','actress','celebrity','series','television','ott','entertainment','song','concert'],
  world: ['international','world','global','country','countries','foreign','un','summit','war','conflict','diplomatic'],
  local: ['city','district','municipal','state','village','town','local','community','police','court'],
};

export const DEFAULT_SECTION_ORDER = ['accident','jobs','politics','business','technology','sports','education','health','entertainment','world','local'];

function tokenize(value: string): string[] {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').split(/\s+/).filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

function keywordScore(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  let score = 0;
  const reasons: string[] = [];
  for (const keyword of keywords) {
    const hits = normalized.split(keyword).length - 1;
    if (hits > 0) {
      score += hits * (keyword.includes(' ') ? 4 : 2);
      reasons.push(keyword);
    }
  }
  return { score, reasons };
}

export function inferSectionId(chunk: Pick<ContentChunk, 'title' | 'body'>, sectionIds = DEFAULT_SECTION_ORDER): MatchResult {
  const text = `${chunk.title}\n${chunk.body}`;
  const tokenSet = new Set(tokenize(text));
  let best: MatchResult = { score: 0, sectionId: 'general', reasons: [] };
  for (const sectionId of sectionIds) {
    const keywords = SECTION_KEYWORDS[sectionId] ?? [];
    const direct = keywordScore(text, keywords);
    const tokenBoost = keywords.reduce((sum, keyword) => sum + (keyword.includes(' ') ? 0 : tokenSet.has(keyword) ? 1 : 0), 0);
    const candidate = { score: direct.score + tokenBoost, sectionId, reasons: direct.reasons };
    if (candidate.score > best.score) best = candidate;
  }
  return best;
}

export function splitMixedContent(raw: string): ContentChunk[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/);
  const chunks: ContentChunk[] = [];
  let title = '';
  let body: string[] = [];

  const flush = () => {
    const content = body.join('\n').trim();
    if (!content && !title.trim()) return;
    chunks.push({ id: `chunk-${chunks.length + 1}`, title: title.trim() || `Story ${chunks.length + 1}`, body: content || title.trim(), source: 'single-paste' });
    title = '';
    body = [];
  };

  for (const line of lines) {
    const value = line.trim();
    if (!value) {
      if (body.length > 0) flush();
      continue;
    }
    const looksLikeHeading = value.length <= 90 && (/^[#]{1,3}\s+/.test(value) || /^[A-Z0-9][^.!?]{2,88}$/.test(value));
    if (looksLikeHeading && (body.length > 0 || !title)) {
      if (body.length > 0) flush();
      title = value.replace(/^#{1,3}\s+/, '');
    } else {
      body.push(value);
    }
  }
  flush();
  return chunks.length ? chunks : [{ id: 'chunk-1', title: 'Story 1', body: trimmed, source: 'single-paste' }];
}

export function rankImageForChunk(image: Pick<EPaperImageElement, 'name'>, chunk: Pick<ContentChunk, 'title' | 'body'>): MatchResult {
  const imageText = image.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  const title = chunk.title.toLowerCase();
  const body = chunk.body.toLowerCase();
  const inferred = inferSectionId(chunk);
  const direct = keywordScore(imageText, SECTION_KEYWORDS[inferred.sectionId] ?? []);
  const titleTokens = new Set(tokenize(title));
  const imageTokens = tokenize(imageText);
  let lexical = 0;
  const reasons = [...direct.reasons];
  for (const token of imageTokens) {
    if (titleTokens.has(token)) {
      lexical += 3;
      reasons.push(`title:${token}`);
    } else if (body.includes(token)) {
      lexical += 1;
      reasons.push(`body:${token}`);
    }
  }
  return { score: direct.score + lexical, sectionId: inferred.sectionId, reasons };
}

export function matchImagesToContent(images: EPaperImageElement[], chunks: ContentChunk[]) {
  return images.map((image) => {
    let best: { chunk: ContentChunk; result: MatchResult } | null = null;
    for (const chunk of chunks) {
      const result = rankImageForChunk(image, chunk);
      if (!best || result.score > best.result.score) best = { chunk, result };
    }
    return { image, chunkId: best?.chunk.id ?? null, score: best?.result.score ?? 0, sectionId: best?.result.sectionId ?? 'general', reasons: best?.result.reasons ?? [] };
  });
}
