import type { ExpenseDetectionInput } from './expenseTrackerTypes';

const AMOUNT_PATTERNS = [
  /(?:rs\.?|inr)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i,
  /(?:amount|paid|spent|debited|debit|purchase).*?([0-9][0-9,]*(?:\.\d{1,2})?)/i,
];

const MERCHANT_PATTERNS = [
  /(?:at|to|merchant)\s+([A-Za-z0-9&._' -]{2,80})/i,
  /(?:vpa|upi|shop)\s*[:\-]?\s*([A-Za-z0-9@._' -]{2,80})/i,
];

function parseAmountMajor(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const normalized = match[1].replace(/,/g, '');
      const amount = Number(normalized);
      if (Number.isFinite(amount) && amount > 0) return amount;
    }
  }
  return null;
}

function parseMerchant(text: string): string | null {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    const merchant = match?.[1]?.trim().replace(/[.,;:]$/, '');
    if (merchant) return merchant;
  }
  return null;
}

function fingerprintMessage(messageId: string, timestampMs: number, body: string): string {
  let hash = 2166136261;
  const input = `${messageId}|${timestampMs}|${body.trim().toLowerCase()}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `sms:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Parses a single SMS body only. Runtime SMS access is intentionally outside this parser.
 * Raw SMS text must not be persisted or sent to the backend.
 */
export function parseExpenseSmsMessage(
  messageId: string,
  body: string,
  timestampMs: number,
): ExpenseDetectionInput | null {
  const amountMajor = parseAmountMajor(body);
  if (amountMajor === null) return null;

  return {
    source: 'sms',
    sourceEventId: messageId,
    amountMinor: Math.round(amountMajor * 100),
    currency: /\bUSD\b|\$/i.test(body) ? 'USD' : 'INR',
    occurredAtMs: timestampMs,
    merchantText: parseMerchant(body),
    rawTextFingerprint: fingerprintMessage(messageId, timestampMs, body),
  };
}
