import type { CurrencyQuote, MarketQuote } from './advancedCalculatorEngine';

export type LiveDataState = {
  currency: CurrencyQuote | null;
  market: MarketQuote | null;
  fetchedAt: string | null;
  error: string | null;
};

const CACHE_KEY = 'nexus-plus.calculator-live.v1';

type CachePayload = { currency?: CurrencyQuote; market?: MarketQuote; savedAt: string };

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

/**
 * Live feeds are intentionally Gateway-backed. The calculator never invents a quote.
 * A compatible backend can expose these endpoints without embedding third-party keys in the APK.
 */
export async function fetchCurrencyQuote(base = 'USD', quote = 'INR'): Promise<CurrencyQuote> {
  const url = process.env.EXPO_PUBLIC_NEXUS_GATEWAY_URL;
  if (!url) throw new Error('Currency live feed is not configured.');
  const response = await fetch(`${url.replace(/\/$/, '')}/v1/market/currency?base=${encodeURIComponent(base)}&quote=${encodeURIComponent(quote)}`);
  if (!response.ok) throw new Error(`Currency feed failed (${response.status}).`);
  const data = await response.json() as { rate?: number; asOf?: string };
  if (!Number.isFinite(data.rate)) throw new Error('Currency feed returned an invalid rate.');
  return { base, quote, rate: data.rate, asOf: data.asOf ?? new Date().toISOString(), source: 'live' };
}

export async function fetchMarketQuote(symbol: string): Promise<MarketQuote> {
  const url = process.env.EXPO_PUBLIC_NEXUS_GATEWAY_URL;
  if (!url) throw new Error('Market live feed is not configured.');
  const response = await fetch(`${url.replace(/\/$/, '')}/v1/market/quote?symbol=${encodeURIComponent(symbol)}`);
  if (!response.ok) throw new Error(`Market feed failed (${response.status}).`);
  const data = await response.json() as { price?: number; changePercent?: number; asOf?: string };
  if (!Number.isFinite(data.price) || !Number.isFinite(data.changePercent)) throw new Error('Market feed returned invalid quote data.');
  return { symbol, price: data.price, changePercent: data.changePercent, asOf: data.asOf ?? new Date().toISOString(), source: 'live' };
}

export async function refreshLiveData(base = 'USD', quote = 'INR', symbol = ''): Promise<LiveDataState> {
  const previous = await loadCachedLiveData();
  const errors: string[] = [];
  let currency = previous.currency;
  let market = previous.market;
  try { currency = await fetchCurrencyQuote(base, quote); } catch (error) { errors.push(error instanceof Error ? error.message : 'Currency refresh failed.'); }
  if (symbol.trim()) {
    try { market = await fetchMarketQuote(symbol.trim()); } catch (error) { errors.push(error instanceof Error ? error.message : 'Market refresh failed.'); }
  }
  const fetchedAt = new Date().toISOString();
  if (currency?.source === 'live' || market?.source === 'live') await saveLiveData({ currency, market, savedAt: fetchedAt });
  return { currency, market, fetchedAt, error: errors.length ? errors.join(' ') : null };
}
