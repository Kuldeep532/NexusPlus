import { askCloudWithFallback, type ProviderResult } from './stage9Providers';
import { looksLikeWebSearchRequest, webSearchThroughGateway, type WebSearchResult } from './stage9WebSearch';

type HistoryItem = { role: 'user' | 'assistant'; text: string };

type AssistantRouterResult = {
  provider: ProviderResult | null;
  web: WebSearchResult[];
};

export async function routeAssistantRequest(input: {
  message: string;
  history?: HistoryItem[];
  bookContext?: { title: string; text: string; truncated?: boolean } | null;
}): Promise<AssistantRouterResult> {
  let web: WebSearchResult[] = [];
  if (looksLikeWebSearchRequest(input.message) && !input.bookContext) {
    try {
      web = await webSearchThroughGateway(input.message);
    } catch {
      web = [];
    }
  }

  const bookContextMessage = input.bookContext
    ? {
        role: 'assistant' as const,
        text: [
          `Active book: ${input.bookContext.title}`,
          'Use this book text as the primary source for book questions and summaries. Do not invent details that are not supported by it.',
          input.bookContext.truncated ? 'Only part of the book is available locally; clearly state when an answer may depend on omitted sections.' : '',
          `Book text:\n${input.bookContext.text}`,
        ].filter(Boolean).join('\n\n'),
      }
    : null;

  const webContextMessage = web.length > 0
    ? {
        role: 'assistant' as const,
        text: `Web results:\n${web.map((item) => `- ${item.title} (${item.url})${item.snippet ? `: ${item.snippet}` : ''}`).join('\n')}`,
      }
    : null;

  const enrichedHistory = [
    ...(input.history ?? []),
    ...(bookContextMessage ? [bookContextMessage] : []),
    ...(webContextMessage ? [webContextMessage] : []),
  ];

  const provider = await askCloudWithFallback({ message: input.message, history: enrichedHistory });
  return { provider, web };
}
