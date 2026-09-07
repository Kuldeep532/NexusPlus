const WINDOW_MS = 60_000;
const MAX_DOWNLOADS_PER_WINDOW = 100;

let windowStartedAt = Date.now();
let downloadsInWindow = 0;
const inFlightVoiceDownloads = new Set<string>();

export class VoiceDownloadRateLimitError extends Error {
  readonly code = 'VOICE_DOWNLOAD_RATE_LIMITED';
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super('Voice downloads are temporarily busy. Please wait a moment and try again.');
    this.name = 'VoiceDownloadRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

function resetWindowIfNeeded(now: number): void {
  if (now - windowStartedAt >= WINDOW_MS) {
    windowStartedAt = now;
    downloadsInWindow = 0;
  }
}

/**
 * App-local burst guard. It counts unique voice-install operations once per
 * voice ID, so the model and JSON config for a single voice count as one
 * download operation. Concurrent calls for the same voice are not double
 * counted because voiceStore already coalesces them behind one lock.
 *
 * This cannot enforce a global 100-users/minute cap across all app installs.
 * That requires shared edge state, for example a Cloudflare Worker + KV.
 */
export function acquireVoiceDownloadSlot(voiceId?: string): void {
  const now = Date.now();
  resetWindowIfNeeded(now);

  if (voiceId && inFlightVoiceDownloads.has(voiceId)) return;
  if (downloadsInWindow >= MAX_DOWNLOADS_PER_WINDOW) {
    throw new VoiceDownloadRateLimitError(Math.max(0, WINDOW_MS - (now - windowStartedAt)));
  }

  downloadsInWindow += 1;
  if (voiceId) inFlightVoiceDownloads.add(voiceId);
}

export function releaseVoiceDownloadSlot(voiceId?: string): void {
  if (voiceId) inFlightVoiceDownloads.delete(voiceId);
}

export function getVoiceDownloadRateLimitInfo(): {
  limit: number;
  used: number;
  remaining: number;
  resetInMs: number;
} {
  const now = Date.now();
  resetWindowIfNeeded(now);
  return {
    limit: MAX_DOWNLOADS_PER_WINDOW,
    used: downloadsInWindow,
    remaining: Math.max(0, MAX_DOWNLOADS_PER_WINDOW - downloadsInWindow),
    resetInMs: Math.max(0, WINDOW_MS - (now - windowStartedAt)),
  };
}
