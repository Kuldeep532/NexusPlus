export type NaturalCommandKind = 'reminder' | 'alarm' | 'music' | 'open-app' | 'open-url' | 'calendar' | 'unknown';

export type NaturalCommand = {
  kind: NaturalCommandKind;
  original: string;
  text?: string;
  hour?: number;
  minute?: number;
  delayMinutes?: number;
  target?: string;
};

const HOUR_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

function parseTime(input: string): { hour: number; minute: number } | null {
  const direct = /\b(?:at|around|by|for|on|पर|को|लगभग)\s*(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i.exec(input);
  const evening = /\b(\d{1,2})(?::(\d{2}))?\s*(?:in the|in)?\s*(morning|afternoon|evening|night)\b/i.exec(input);
  const m = direct ?? evening;
  if (!m) return null;
  let hour = HOUR_WORDS[String(m[1]).toLowerCase()] ?? Number(m[1]);
  const minute = Number(m[2] ?? 0);
  const rawMeridiem = direct?.[3]?.toLowerCase().replace(/\./g, '');
  const daypart = evening?.[3]?.toLowerCase();
  if (rawMeridiem === 'pm' && hour < 12) hour += 12;
  if (rawMeridiem === 'am' && hour === 12) hour = 0;
  if (daypart && daypart !== 'morning' && hour < 12) hour += 12;
  if (daypart === 'night' && hour === 12) hour = 0;
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 ? { hour, minute } : null;
}

function parseDelay(input: string): number | null {
  const m = /\b(?:in|after|within|में|बाद)\s*(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|seconds?|मिनट|घंटे|घंटा)\b/i.exec(input);
  if (!m) {
    if (/\b(?:in|after|within)\s+(?:half an hour|half hour)\b/i.test(input)) return 30;
    return null;
  }
  const value = Math.max(0.1, Number(m[1]));
  const unit = m[2].toLowerCase();
  if (/hour|hr|घंट/.test(unit)) return Math.max(1, Math.round(value * 60));
  if (/second|sec/.test(unit)) return Math.max(1, Math.ceil(value / 60));
  return Math.max(1, Math.round(value));
}

function extractReminderText(input: string): string {
  let value = input.trim();
  value = value.replace(/^\s*(?:please\s*)?(?:remind me|reminder|remember to|don't let me forget|do not let me forget|याद दिलाना|मुझे याद दिलाना|रिमाइंडर)\b\s*/i, '');
  value = value.replace(/\b(?:at|around|by|for|on|पर|को|लगभग)\s*(?:\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\b/i, '');
  value = value.replace(/\b\d{1,2}(?::\d{2})?\s*(?:in the|in)?\s*(?:morning|afternoon|evening|night)\b/i, '');
  value = value.replace(/\b(?:in|after|within|में|बाद)\s*(?:\d+(?:\.\d+)?)\s*(?:seconds?|secs?|minutes?|mins?|hours?|hrs?|मिनट|घंटे|घंटा)\b/i, '');
  value = value.replace(/\b(?:in|after|within)\s+(?:half an hour|half hour)\b/i, '');
  value = value.replace(/^\s*(?:for|to|के लिए|कि)\s+/i, '');
  value = value.replace(/^[,;:\-]+|[,;:\-]+$/g, '');
  return value.replace(/\s+/g, ' ').trim() || 'Nexus Assistant reminder';
}

export function parseNaturalCommand(input: string): NaturalCommand {
  const original = input.trim();
  if (!original) return { kind: 'unknown', original: '' };

  const reminder = /\b(remind me|reminder|remember to|don't let me forget|do not let me forget|याद दिलाना|रिमाइंडर|मुझे याद दिलाना)\b/i.test(original);
  const alarm = /\b(alarm|wake me|अलार्म|जगाना)\b/i.test(original);
  const calendar = /\b(calendar|meeting|appointment|event|schedule|कैलेंडर|मीटिंग|अपॉइंटमेंट)\b/i.test(original);
  const music = /\b(play|pause|resume|next song|previous song|music|song|गाना|म्यूजिक|चलाओ|बजाओ)\b/i.test(original);
  const url = /https?:\/\/\S+/i.exec(original);

  if (reminder) {
    const time = parseTime(original);
    const delay = parseDelay(original);
    return {
      kind: 'reminder',
      original,
      text: extractReminderText(original),
      ...(time ?? {}),
      ...(delay ? { delayMinutes: delay } : {}),
    };
  }
  if (alarm) {
    const time = parseTime(original);
    return { kind: 'alarm', original, ...(time ?? {}) };
  }
  if (calendar) return { kind: 'calendar', original, text: original };
  if (music) return { kind: 'music', original, text: original };
  if (url) return { kind: 'open-url', original, target: url[0] };
  return { kind: 'unknown', original };
}
