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
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

function parseTime(input: string): { hour: number; minute: number } | null {
  const m = /\b(?:at|around|by|for|on|पर|को|लगभग)\s*(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i.exec(input);
  if (!m) return null;
  let hour = HOUR_WORDS[m[1].toLowerCase()] ?? Number(m[1]);
  const minute = Number(m[2] ?? 0);
  const ap = m[3]?.toLowerCase().replace(/\./g, '');
  if (ap === 'pm' && hour < 12) hour += 12;
  if (ap === 'am' && hour === 12) hour = 0;
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 ? { hour, minute } : null;
}

function parseDelay(input: string): number | null {
  const m = /\b(?:in|after|within|में|बाद)\s*(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|seconds?|मिनट|घंटे|घंटा)\b/i.exec(input);
  if (!m) return null;
  const value = Math.max(1, Number(m[1]));
  const unit = m[2].toLowerCase();
  if (/hour|hr|घंट/.test(unit)) return value * 60;
  if (/second|sec/.test(unit)) return Math.max(1, Math.ceil(value / 60));
  return value;
}

function extractReminderText(input: string): string {
  let value = input.trim();
  value = value.replace(/^\s*(?:please\s*)?(?:remind me|reminder|remember to|याद दिलाना|मुझे याद दिलाना|रिमाइंडर)\b\s*/i, '');
  value = value.replace(/\b(?:at|around|by|for|on|पर|को|लगभग)\s*(?:\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\b/i, '');
  value = value.replace(/\b(?:in|after|within|में|बाद)\s*\d+\s*(?:seconds?|secs?|minutes?|mins?|hours?|hrs?|मिनट|घंटे|घंटा)\b/i, '');
  value = value.replace(/^\s*(?:for|to|के लिए|कि)\s+/i, '');
  value = value.replace(/^\s*(?:at|around|by|for|to|on|पर|को)\s+/i, '');
  return value.replace(/\s+/g, ' ').replace(/^[,;:\-]+|[,;:\-]+$/g, '').trim() || 'Nexus Assistant reminder';
}

export function parseNaturalCommand(input: string): NaturalCommand {
  const original = input.trim();
  const reminder = /\b(remind me|reminder|remember to|याद दिलाना|रिमाइंडर)\b/i.test(original);
  const alarm = /\b(alarm|wake me|अलार्म|जगाना)\b/i.test(original);
  const calendar = /\b(calendar|meeting|appointment|event|कैलेंडर|मीटिंग|अपॉइंटमेंट)\b/i.test(original);
  const music = /\b(play|pause|resume|next song|previous song|music|song|गाना|म्यूजिक)\b/i.test(original);
  const url = /https?:\/\/\S+/i.exec(original);
  if (reminder) {
    const time = parseTime(original);
    const delay = parseDelay(original);
    return { kind: 'reminder', original, text: extractReminderText(original), ...(time ?? {}), ...(delay ? { delayMinutes: delay } : {}) };
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
