export type MessageLanguage = 'en' | 'hi' | 'hinglish';

export interface MessageContext {
  purpose: 'email' | 'meeting' | 'follow_up' | 'reminder' | 'announcement';
  recipientName?: string;
  senderName?: string;
  subject?: string;
  keyPoints: string[];
  dateTimeText?: string;
  action?: string;
  tone?: 'professional' | 'friendly' | 'concise';
  language?: MessageLanguage;
}

export interface ComposedMessage { subject: string; body: string; language: MessageLanguage; source: 'local-patterns'; }

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
const points = (items: string[]) => items.filter(Boolean).map(clean).slice(0, 6);

/** Tiny deterministic composer. No model weights are shipped in the APK. */
export function composeMessage(context: MessageContext): ComposedMessage {
  const language = context.language ?? 'hinglish';
  const name = context.recipientName ? ` ${context.recipientName}` : '';
  const list = points(context.keyPoints);
  const details = list.length ? list.map((item) => `• ${item}`).join('\n') : '';
  const tone = context.tone ?? 'professional';
  const subject = clean(context.subject ?? (context.purpose === 'meeting' ? 'Meeting details' : 'Quick update'));
  let body: string;
  if (language === 'hi') body = `नमस्ते${name},\n\n${context.purpose === 'meeting' ? 'मीटिंग के संबंध में यह जानकारी साझा कर रहा हूँ।' : 'यह एक संक्षिप्त अपडेट है।'}\n${details}${context.dateTimeText ? `\n\nसमय: ${context.dateTimeText}` : ''}${context.action ? `\n\nअगला कदम: ${context.action}` : ''}\n\nधन्यवाद${context.senderName ? `,\n${context.senderName}` : ''}`;
  else if (language === 'en') body = `Hello${name},\n\n${context.purpose === 'meeting' ? 'I am sharing the details for our meeting.' : 'Here is a quick update.'}\n${details}${context.dateTimeText ? `\n\nTime: ${context.dateTimeText}` : ''}${context.action ? `\n\nNext step: ${context.action}` : ''}\n\nThank you${context.senderName ? `,\n${context.senderName}` : ''}`;
  else body = `Hello${name},\n\n${context.purpose === 'meeting' ? 'Meeting ke regarding quick details share kar raha hoon.' : 'Ek quick update share kar raha hoon.'}\n${details}${context.dateTimeText ? `\n\nTime: ${context.dateTimeText}` : ''}${context.action ? `\n\nNext step: ${context.action}` : ''}\n\nThanks${context.senderName ? `,\n${context.senderName}` : ''}`;
  return { subject, body: tone === 'concise' ? body.replace(/\n\n+/g, '\n\n') : body.trim(), language, source: 'local-patterns' };
}
