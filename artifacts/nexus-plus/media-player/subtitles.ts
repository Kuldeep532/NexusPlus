import type { SubtitleCue } from './types';

const TIME = /^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/;

function parseTimestamp(value: string): number {
  const match = value.trim().match(TIME);
  if (!match) return 0;
  const [, h, m, s, ms] = match;
  return Number(h) * 3_600_000 + Number(m) * 60_000 + Number(s) * 1_000 + Number(ms);
}

export function parseSrt(input: string): SubtitleCue[] {
  const blocks = input.replace(/\r/g, '').trim().split(/\n{2,}/);
  const cues: SubtitleCue[] = [];

  blocks.forEach((block, index) => {
    const lines = block.split('\n');
    const timingIndex = lines.findIndex((line) => line.includes('-->'));
    if (timingIndex < 0) return;

    const [start, end] = lines[timingIndex].split('-->').map((v) => v.trim());
    const text = lines.slice(timingIndex + 1).join('\n').trim();
    if (!text) return;

    cues.push({
      id: `srt-${index + 1}`,
      startMs: parseTimestamp(start),
      endMs: parseTimestamp(end),
      text,
    });
  });

  return cues.sort((a, b) => a.startMs - b.startMs);
}

export function findActiveCue(cues: SubtitleCue[], positionMs: number): SubtitleCue | undefined {
  return cues.find((cue) => positionMs >= cue.startMs && positionMs < cue.endMs);
}

export function formatTime(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}
