import type { KaraokeLyricsLine } from './karaokeTypes';

function parseTimestamp(value: string): number | null {
  const match = value.trim().match(/^(\d+):([0-5]\d(?:\.\d+)?)$/);
  if (!match) return null;
  return (Number(match[1]) * 60 + Number(match[2])) * 1000;
}

/** Parse common LRC-style timestamped lyrics, including multiple timestamps on one line. */
export function parseKaraokeLyrics(text: string): KaraokeLyricsLine[] {
  const parsed: KaraokeLyricsLine[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/^\uFEFF/, '').trim();
    if (!line) continue;

    // Ignore standard LRC metadata such as [ar:], [ti:], [by:], etc.
    const timestampMatches = [...line.matchAll(/\[(\d+:[0-5]\d(?:\.\d+)?)\]/g)];
    if (!timestampMatches.length) continue;

    const clean = line.replace(/\[\d+:[0-5]\d(?:\.\d+)?\]/g, '').trim();
    if (!clean) continue;

    for (const match of timestampMatches) {
      const startMs = parseTimestamp(match[1]);
      if (startMs !== null) parsed.push({ startMs, text: clean });
    }
  }

  parsed.sort((a, b) => a.startMs - b.startMs || a.text.localeCompare(b.text));
  return parsed.map((line, index) => ({
    ...line,
    endMs: parsed[index + 1]?.startMs,
  }));
}

export function findActiveLyric(lines: KaraokeLyricsLine[], positionMs: number): number {
  let low = 0;
  let high = lines.length - 1;
  let active = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lines[mid].startMs <= positionMs) {
      active = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return active;
}
