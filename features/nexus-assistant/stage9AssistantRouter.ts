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
}): Promise<AssistantRouterResult> {
  let web: WebSearchResult[] = [];
  if (looksLikeWebSearchRequest(input.message)) {
    try {
      web = await webSearchThroughGateway(input.message);
    } catch {
      web = [];
    }
  }

  const enrichedHistory = web.length > 0
    ? [
        ...(input.history ?? []),
        {
          role: 'assistant' as const,
          text: `Web results:\n${web.map((item) => `- ${item.title} (${item.url})${item.snippet ? `: ${item.snippet}` : ''}`).join('\n')}`,
        },
      ]
    : input.history;

  const provider = await askCloudWithFallback({ message: input.message, history: enrichedHistory });
  return { provider, web };
}
