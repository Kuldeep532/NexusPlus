import { callGateway, discoverGatewayEndpoints, type GatewayEndpoint } from '@/features/api-gateway/apiGatewayClient';

export type WebSearchResult = {
  title: string;
  url: string;
  snippet?: string;
};

function findSearchEndpoint(endpoints: GatewayEndpoint[]): GatewayEndpoint | null {
  return endpoints
    .map((endpoint) => {
      const text = `${endpoint.id} ${endpoint.path} ${endpoint.feature ?? ''} ${endpoint.description ?? ''}`.toLowerCase();
      let score = 0;
      if (text.includes('search')) score += 5;
      if (text.includes('web') || text.includes('internet') || text.includes('browser')) score += 3;
      if (text.includes('query') || text.includes('research')) score += 1;
      return { endpoint, score };
    })
    .filter((item) => item.score >= 5)
    .sort((a, b) => b.score - a.score)[0]?.endpoint ?? null;
}

function normalizeResults(payload: any): WebSearchResult[] {
  const source = payload?.results ?? payload?.items ?? payload?.organic ?? payload?.data?.results;
  if (!Array.isArray(source)) return [];
  return source.flatMap((item: any) => {
    const title = item?.title ?? item?.name;
    const url = item?.url ?? item?.link;
    const snippet = item?.snippet ?? item?.description ?? item?.content;
    if (typeof title !== 'string' || typeof url !== 'string') return [];
    return [{ title: title.trim(), url: url.trim(), ...(typeof snippet === 'string' ? { snippet: snippet.trim() } : {}) }];
  }).slice(0, 8);
}

export function looksLikeWebSearchRequest(message: string): boolean {
  return /\b(search|web search|internet|look up|latest|news|online|website)\b|खोज|वेब|इंटरनेट|ताज़ा|न्यूज़|ऑनलाइन/i.test(message);
}

export async function webSearchThroughGateway(query: string): Promise<WebSearchResult[]> {
  const endpoints = await discoverGatewayEndpoints();
  const endpoint = findSearchEndpoint(endpoints);
  if (!endpoint) return [];

  const payload = await callGateway<any>(endpoint.path, {
    method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    query: endpoint.method === 'GET' ? { q: query, query } : undefined,
    body: endpoint.method === 'GET' ? undefined : { q: query, query },
  });

  return normalizeResults(payload);
}
