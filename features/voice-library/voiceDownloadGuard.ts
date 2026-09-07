const WINDOW_MS = 60_000;
const MAX_DOWNLOADS_PER_WINDOW = 100;

let windowStartedAt = Date.now();
let downloadsInWindow = 0;

export class VoiceDownloadRateLimitError extends Error {
  readonly code = 'VOICE_DOWNLOAD_RATE_LIMITED';
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super('Voice downloads are temporarily busy. Please try again in a few seconds.');
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
 * Client-side burst guard. It protects this app instance from opening more
 * than 100 voice-install operations in a rolling one-minute window.
 *
 * This is intentionally an app-local safety valve, not a global service rate
 * limiter. A true cross-user 100/minute limit must live at a shared edge/API
 * layer such as Cloudflare.
 */
export function acquireVoiceDownloadSlot(): void {
  const now = Date.now();
  resetWindowIfNeeded(now);
  if (downloadsInWindow >= MAX_DOWNLOADS_PER_WINDOW) {
    throw new VoiceDownloadRateLimitError(Math.max(0, WINDOW_MS - (now - windowStartedAt)));
  }
  downloadsInWindow += 1;
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
