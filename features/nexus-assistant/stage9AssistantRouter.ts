import { askCloudWithFallback, type ProviderResult } from './stage9Providers';
import { looksLikeWebSearchRequest, webSearchThroughGateway, type WebSearchResult } from './stage9WebSearch';
import { buildContextPrompt } from './contextRouter';
import type { BookAssistantContext } from './bookContext';
import type { ActiveFileContext } from './fileAssistantStore';

type HistoryItem = { role: 'user' | 'assistant'; text: string };

type AssistantRouterResult = {
  provider: ProviderResult | null;
  web: WebSearchResult[];
};

export async function routeAssistantRequest(input: {
  message: string;
  history?: HistoryItem[];
  bookContext?: BookAssistantContext | null;
  fileContext?: ActiveFileContext | null;
}): Promise<AssistantRouterResult> {
  let web: WebSearchResult[] = [];
  if (looksLikeWebSearchRequest(input.message) && !input.bookContext && !input.fileContext) {
    try {
      web = await webSearchThroughGateway(input.message);
    } catch {
      web = [];
    }
  }

  const localContext = buildContextPrompt({
    book: input.bookContext ?? null,
    file: input.fileContext ?? null,
  });

  const webContextMessage = web.length > 0
    ? {
        role: 'assistant' as const,
        text: `Web results:\n${web.map((item) => `- ${item.title} (${item.url})${item.snippet ? `: ${item.snippet}` : ''}`).join('\n')}`,
      }
    : null;

  const enrichedHistory = [
    ...(input.history ?? []),
    ...(localContext ? [{ role: 'assistant' as const, text: localContext }] : []),
    ...(webContextMessage ? [webContextMessage] : []),
  ];

  const provider = await askCloudWithFallback({ message: input.message, history: enrichedHistory });
  return { provider, web };
}
