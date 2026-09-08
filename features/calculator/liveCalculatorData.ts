import type { CurrencyQuote, MarketQuote } from './advancedCalculatorEngine';

export type LiveDataState = {
  currency: CurrencyQuote | null;
  market: MarketQuote | null;
  fetchedAt: string | null;
  error: string | null;
};

type CachePayload = { currency?: CurrencyQuote; market?: MarketQuote; savedAt: string };
const CACHE_KEY = 'nexus-plus.calculator-live.v2';
const REQUEST_TIMEOUT_MS = 8000;

export async function loadCachedLiveData(): Promise<LiveDataState> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return { currency: null, market: null, fetchedAt: null, error: null };
    const parsed = JSON.parse(raw) as CachePayload;
    return { currency: parsed.currency ?? null, market: parsed.market ?? null, fetchedAt: parsed.savedAt, error: null };
  } catch {
    return { currency: null, market: null, fetchedAt: null, error: 'Live-data cache unavailable.' };
  }
}

export async function saveLiveData(payload: CachePayload) {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Live feed failed (${response.status}).`);
    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Live feed timed out.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * No API Gateway is used here. Currency data comes directly from a public HTTPS
 * exchange-rate feed. Calculations remain fully local and deterministic.
 */
export async function fetchCurrencyQuote(base = 'USD', quote = 'INR'): Promise<CurrencyQuote> {
  const normalizedBase = base.trim().toUpperCase();
  const normalizedQuote = quote.trim().toUpperCase();
  const data = await fetchJson<{ rates?: Record<string, number>; time_last_update_utc?: string }>(
    `https://open.er-api.com/v6/latest/${encodeURIComponent(normalizedBase)}`,
  );
  const rate = data.rates?.[normalizedQuote];
  if (!Number.isFinite(rate)) throw new Error(`Currency pair ${normalizedBase}/${normalizedQuote} is unavailable.`);
  return {
    base: normalizedBase,
    quote: normalizedQuote,
    rate,
    asOf: data.time_last_update_utc ?? new Date().toISOString(),
    source: 'live',
  };
}

/**
 * Market quotes deliberately use a direct HTTPS adapter with no secrets in the APK.
 * A symbol only succeeds when the configured public provider returns valid data.
 * If it is unavailable, the UI keeps the last cached quote instead of inventing one.
 */
export async function fetchMarketQuote(symbol: string): Promise<MarketQuote> {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) throw new Error('Enter a market symbol.');
  const data = await fetchJson<{ price?: number; changePercent?: number; timestamp?: string }>(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalized)}?range=1d&interval=1m`,
  );
  const result = (data as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; regularMarketChangePercent?: number; regularMarketTime?: number } }> } }).chart?.result?.[0];
  const price = result?.meta?.regularMarketPrice;
  const changePercent = result?.meta?.regularMarketChangePercent;
  if (!Number.isFinite(price) || !Number.isFinite(changePercent)) throw new Error(`Market quote unavailable for ${normalized}.`);
  return {
    symbol: normalized,
    price,
    changePercent,
    asOf: result?.meta?.regularMarketTime ? new Date(result.meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
    source: 'live',
  };
}

export async function refreshLiveData(base = 'USD', quote = 'INR', symbol = ''): Promise<LiveDataState> {
  const previous = await loadCachedLiveData();
  const errors: string[] = [];
  let currency = previous.currency;
  let market = previous.market;
  try {
    currency = await fetchCurrencyQuote(base, quote);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Currency refresh failed.');
  }
  if (symbol.trim()) {
    try {
      market = await fetchMarketQuote(symbol);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Market refresh failed.');
    }
  }
  const fetchedAt = new Date().toISOString();
  if (currency?.source === 'live' || market?.source === 'live') {
    await saveLiveData({ currency, market, savedAt: fetchedAt });
  }
  return { currency, market, fetchedAt, error: errors.length ? errors.join(' ') : null };
}
