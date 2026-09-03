import * as SQLite from 'expo-sqlite';
import { getWeatherThroughGateway } from './stage5Cloud';

const dbPromise = SQLite.openDatabaseAsync('nexus-assistant.db');
const CACHE_TTL_MS = 15 * 60 * 1000;

export type LocalWeather = {
  text: string;
  location?: string;
  fetchedAt: number;
  source: 'gateway' | 'cache';
};

async function initWeatherCache(): Promise<void> {
  const db = await dbPromise;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS weather_cache (
      cache_key TEXT PRIMARY KEY NOT NULL,
      location TEXT,
      response_text TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );
  `);
}

function cacheKey(input: { location?: string; latitude?: number; longitude?: number }): string {
  return JSON.stringify([
    input.location?.trim().toLowerCase() ?? '',
    input.latitude ?? null,
    input.longitude ?? null,
  ]);
}

async function readCachedWeather(key: string): Promise<LocalWeather | null> {
  const db = await dbPromise;
  const row = await db.getFirstAsync<{ location: string | null; responseText: string; fetchedAt: number }>(
    'SELECT location, response_text as responseText, fetched_at as fetchedAt FROM weather_cache WHERE cache_key = ?',
    key,
  );
  if (!row) return null;
  return { text: row.responseText, location: row.location ?? undefined, fetchedAt: row.fetchedAt, source: 'cache' };
}

async function writeCachedWeather(key: string, weather: LocalWeather): Promise<void> {
  const db = await dbPromise;
  await db.runAsync(
    'INSERT OR REPLACE INTO weather_cache (cache_key, location, response_text, fetched_at) VALUES (?, ?, ?, ?)',
    key,
    weather.location ?? null,
    weather.text,
    weather.fetchedAt,
  );
}

export async function getWeatherLocalFirst(input: {
  location?: string;
  latitude?: number;
  longitude?: number;
}): Promise<LocalWeather | null> {
  await initWeatherCache();
  const key = cacheKey(input);
  const cached = await readCachedWeather(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached;

  try {
    const live = await getWeatherThroughGateway(input);
    if (!live) return cached;
    const result: LocalWeather = {
      text: live.text,
      location: input.location,
      fetchedAt: Date.now(),
      source: 'gateway',
    };
    await writeCachedWeather(key, result);
    return result;
  } catch {
    return cached;
  }
}

export async function clearWeatherCache(): Promise<void> {
  const db = await dbPromise;
  await db.execAsync('DELETE FROM weather_cache;');
}
