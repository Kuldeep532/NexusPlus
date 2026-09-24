export type DiscoverCategory = 'top' | 'world' | 'technology' | 'science' | 'business' | 'health' | 'entertainment';

export type DiscoverFeed = {
  id: string;
  category: Exclude<DiscoverCategory, 'top'>;
  name: string;
  url: string;
  attributionUrl: string;
};

export type DiscoverItem = {
  id: string;
  title: string;
  summary: string;
  link: string;
  publishedAt?: string;
  source: string;
  sourceUrl: string;
  category: DiscoverCategory;
};

export const DISCOVER_FEEDS: DiscoverFeed[] = [
  {
    id: 'bbc-world',
    category: 'world',
    name: 'BBC — World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    attributionUrl: 'https://www.bbc.com/news/10628494',
  },
  {
    id: 'bbc-technology',
    category: 'technology',
    name: 'BBC — Technology',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    attributionUrl: 'https://www.bbc.com/news/10628494',
  },
  {
    id: 'bbc-science-environment',
    category: 'science',
    name: 'BBC — Science & Environment',
    url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    attributionUrl: 'https://www.bbc.com/news/10628494',
  },
  {
    id: 'bbc-business',
    category: 'business',
    name: 'BBC — Business',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    attributionUrl: 'https://www.bbc.com/news/10628494',
  },
  {
    id: 'bbc-health',
    category: 'health',
    name: 'BBC — Health',
    url: 'https://feeds.bbci.co.uk/news/health/rss.xml',
    attributionUrl: 'https://www.bbc.com/news/10628494',
  },
  {
    id: 'bbc-entertainment',
    category: 'entertainment',
    name: 'BBC — Entertainment & Arts',
    url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
    attributionUrl: 'https://www.bbc.com/news/10628494',
  },

  {
    id: 'guardian-world',
    category: 'world',
    name: 'The Guardian — World',
    url: 'https://www.theguardian.com/world/rss',
    attributionUrl: 'https://www.theguardian.com/help/feeds',
  },
  {
    id: 'guardian-technology',
    category: 'technology',
    name: 'The Guardian — Technology',
    url: 'https://www.theguardian.com/technology/rss',
    attributionUrl: 'https://www.theguardian.com/help/feeds',
  },
  {
    id: 'guardian-science',
    category: 'science',
    name: 'The Guardian — Science',
    url: 'https://www.theguardian.com/science/rss',
    attributionUrl: 'https://www.theguardian.com/help/feeds',
  },
  {
    id: 'sciencedaily-top-science',
    category: 'science',
    name: 'ScienceDaily — Top Science',
    url: 'https://www.sciencedaily.com/rss/top/science.xml',
    attributionUrl: 'https://www.sciencedaily.com/newsfeeds.htm',
  },
  {
    id: 'sciencedaily-technology',
    category: 'technology',
    name: 'ScienceDaily — Technology',
    url: 'https://www.sciencedaily.com/rss/top/technology.xml',
    attributionUrl: 'https://www.sciencedaily.com/newsfeeds.htm',
  },
  {
    id: 'jpl-news',
    category: 'science',
    name: 'NASA JPL — News & Features',
    url: 'https://www.jpl.nasa.gov/feeds/news/',
    attributionUrl: 'https://www.jpl.nasa.gov/rss/',
  },
];

export const CATEGORY_LABELS: Record<DiscoverCategory, string> = {
  top: 'Top',
  world: 'World',
  technology: 'Technology',
  science: 'Science',
  business: 'Business',
  health: 'Health',
  entertainment: 'Entertainment',
};

export const CATEGORY_ICONS: Record<DiscoverCategory, string> = {
  top: 'compass',
  world: 'globe',
  technology: 'cpu',
  science: 'activity',
  business: 'briefcase',
  health: 'heart',
  entertainment: 'film',
};

function firstTagValue(xml: string, tag: string): string {
  const match = xml.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'));
  return decodeXml(match?.[1] ?? '').trim();
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRss(xml: string, feed: DiscoverFeed): DiscoverItem[] {
  const items: DiscoverItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks.slice(0, 30)) {
    const title = firstTagValue(block, 'title');
    const link = firstTagValue(block, 'link');
    const summary = firstTagValue(block, 'description');
    const publishedAt = firstTagValue(block, 'pubDate') || firstTagValue(block, 'dc:date');
    if (!title || !link) continue;
    items.push({
      id: link,
      title,
      summary,
      link,
      publishedAt,
      source: feed.name,
      sourceUrl: feed.attributionUrl,
      category: feed.category,
    });
  }
  return items;
}

async function fetchFeed(feed: DiscoverFeed, signal: AbortSignal): Promise<DiscoverItem[]> {
  const response = await fetch(feed.url, { signal });
  if (!response.ok) throw new Error('RSS request failed: ' + response.status);
  return parseRss(await response.text(), feed);
}

export async function fetchDiscoverItems(category: DiscoverCategory, signal?: AbortSignal): Promise<DiscoverItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const effectiveSignal = signal ?? controller.signal;
  try {
    const feeds = DISCOVER_FEEDS.filter((feed) => category === 'top' || feed.category === category);
    const groups = await Promise.allSettled(feeds.map((feed) => fetchFeed(feed, effectiveSignal)));
    const items = groups.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    const seen = new Set<string>();
    return items
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => {
        const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return bt - at;
      });
  } finally {
    clearTimeout(timeout);
  }
}
