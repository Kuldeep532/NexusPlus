import type { KaraokeLyricsLine } from './karaokeTypes';

function parseTimestamp(value: string): number | null {
  const match = value.trim().match(/^(\d+):([0-5]\d(?:\.\d+)?)$/);
  if (!match) return null;
  return (Number(match[1]) * 60 + Number(match[2])) * 1000;
}

/** Parse common LRC-style timestamped lyrics. Plain lines are retained with sequential timing. */
export function parseKaraokeLyrics(text: string): KaraokeLyricsLine[] {
  const lines = text.split(/\r?\n/);
  const parsed: KaraokeLyricsLine[] = [];
  for (const line of lines) {
    const matches = [...line.matchAll(/\[(\d+:[0-5]\d(?:\.\d+)?)\]/g)];
    const clean = line.replace(/\[\d+:[0-5]\d(?:\.\d+)?\]/g, '').trim();
    if (!clean || matches.length === 0) continue;
    for (const match of matches) {
      const startMs = parseTimestamp(match[1]);
      if (startMs !== null) parsed.push({ startMs, text: clean });
    }
  }
  parsed.sort((a, b) => a.startMs - b.startMs);
  return parsed.map((line, index) => ({
    ...line,
    endMs: parsed[index + 1]?.startMs,
  }));
}

export function findActiveLyric(lines: KaraokeLyricsLine[], positionMs: number): number {
  let active = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].startMs <= positionMs) active = i;
    else break;
  }
  return active;
}
