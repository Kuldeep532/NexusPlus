import {
  getAssistantCapability,
  requiresCapabilityConfirmation,
  type AssistantCapability,
} from './agentCapabilities';
import { parseAssistantPdfCommand } from './pdfAssistantCommands';
import { searchAssistantTools } from './assistantToolAdapter';
import { parseMusicIntent } from './musicIntent';

export type CapabilityProposal = {
  capability: AssistantCapability;
  args: Record<string, string>;
  requiresConfirmation: boolean;
  reason: string;
};

function parseClockTime(text: string): { hour: number; minute: number } | null {
  const match = /(?:at|around|by|for|on|पर|को|लगभग)\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i.exec(text);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const meridiem = match[3]?.toLowerCase().replace(/\\./g, '');
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function parseRelativeMinutes(text: string): number | null {
  const match = /(?:in|after|within|में|बाद)\s*(\d+)\s*(minute|minutes|min|mins|मिनट|hour|hours|hr|hrs|घंटे|घंटा)/i.exec(text);
  if (!match) return null;
  const value = Math.max(1, Number(match[1]));
  return /hour|hr|hrs|घंटे|घंटा/i.test(match[2]) ? value * 60 : value;
}

function cleanReminderText(text: string): string {
  let value = text.trim();
  value = value.replace(/^\s*(?:remind me|reminder|please remind me|remember to|याद दिलाना|रिमाइंडर|मुझे याद दिलाना)\s*/i, '');
  value = value.replace(/^\s*(?:at|around|by|for|पर|को)\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s*/i, '');
  value = value.replace(/^\s*(?:in|after|within|में|बाद)\s*\d+\s*(?:minute|minutes|min|mins|मिनट|hour|hours|hr|hrs|घंटे|घंटा)\s*/i, '');
  value = value.replace(/^\s*(?:for|to|के लिए|कि)\s*/i, '');
  value = value.replace(/^\s*(?:at|around|by|for|पर|को)\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s*(?:for|to|के लिए)?\s*/i, '');
  value = value.replace(/^[,;:\-]+\s*/, '');
  return value.trim() || 'Nexus Assistant reminder';
}

const COMMAND_PATTERNS: Array<{
  id: string;
  pattern: RegExp;
  reason: string;
  args: (match: RegExpExecArray) => Record<string, string>;
}> = [
  { id: 'battery-status', pattern: /(?:battery|बैटरी)/i, reason: 'The user appears to be asking for battery state.', args: () => ({}) },
  { id: 'device-info', pattern: /(?:device information|phone info|डिवाइस|फोन की जानकारी)/i, reason: 'The request appears to ask for basic device information.', args: () => ({}) },
  { id: 'open-url', pattern: /(?:open|खोलो|खोलना)\s+(https?:\/\/\\S+)/i, reason: 'The user requested opening a specific URL.', args: (match) => ({ url: match[1] }) },
  { id: 'create-reminder', pattern: /(?:remind|reminder|remember|याद|रिमाइंडर)/i, reason: 'The request appears to create a reminder.', args: (match) => {
      const minutes = parseRelativeMinutes(match.input);
      const clock = parseClockTime(match.input);
      const message = cleanReminderText(match.input);
      return {
        ...(minutes ? { delayMinutes: String(minutes) } : {}),
        ...(clock ? { hour: String(clock.hour), minute: String(clock.minute) } : {}),
        message,
      };
    } },
  { id: 'set-alarm', pattern: /(?:set|start|wake me|लगाओ|सेट करो|जगाना).*\b(?:alarm|अलार्म)\b/i, reason: 'The user requested a device alarm.', args: (match) => {
      const clock = parseClockTime(match.input);
      if (!clock) return {};
      return { hour: String(clock.hour), minute: String(clock.minute) };
    } },
  { id: 'calendar-event', pattern: /(?:add|create|schedule|book|set).*\b(?:calendar|event|meeting|appointment)\b|कैलेंडर|मीटिंग|अपॉइंटमेंट/i, reason: 'The user requested a calendar event.', args: (match) => ({ title: match.input.trim() }) },
];

export function planCapability(request: string): CapabilityProposal | null {
  const pdf = parseAssistantPdfCommand(request);
  if (pdf) {
    const id = pdf.kind === 'lock' ? 'pdf-lock'
      : pdf.kind === 'unlock' ? 'pdf-unlock'
      : pdf.kind === 'compress' ? 'pdf-compress'
      : pdf.kind === 'rotate' ? 'pdf-rotate'
      : null;

    if (id) {
      const capability = getAssistantCapability(id);
      if (!capability) return null;
      const args: Record<string, string> = { command: pdf.kind };
      if (pdf.kind === 'compress') args.quality = String(pdf.quality);
      if (pdf.kind === 'rotate') args.degrees = String(pdf.degrees);
      return {
        capability,
        args,
        requiresConfirmation: requiresCapabilityConfirmation(id),
        reason: 'The user requested a PDF operation on a selected local PDF.',
      };
    }
  }

  const text = request.trim();
  if (!text) return null;

  const music = parseMusicIntent(text);
  if (music) {
    const capability = getAssistantCapability('play-media');
    if (capability) {
      return {
        capability,
        args: {
          action: music.action,
          ...(music.query ? { query: music.query } : {}),
        },
        requiresConfirmation: false,
        reason: 'The request is a direct music playback control or song search command.',
      };
    }
  }

  const qrRequest = /(?:qr|qrcode|qr code|क्यूआर|क्यूआर कोड|upi qr|wifi qr|whatsapp qr)/i.test(text);
  if (qrRequest) {
    const capability = getAssistantCapability('qr-generate');
    if (capability) return { capability, args: { query: text }, requiresConfirmation: false, reason: 'The request appears to ask the existing QR generator to create a QR code.' };
  }

  const tool = searchAssistantTools(text).find((item) => item.id !== 'qr-code' && item.kind === 'route');
  if (tool) {
    const capability = getAssistantCapability('tool-open');
    if (capability) return { capability, args: { toolId: tool.id, route: tool.route ?? '' }, requiresConfirmation: false, reason: 'The request matches a registered Nexus Plus tool.' };
  }
  for (const candidate of COMMAND_PATTERNS) {
    const match = candidate.pattern.exec(text);
    if (!match) continue;
    const capability = getAssistantCapability(candidate.id);
    if (!capability) return null;
    return {
      capability,
      args: candidate.args(match),
      requiresConfirmation: requiresCapabilityConfirmation(candidate.id),
      reason: candidate.reason,
    };
  }
  return null;
}

export function formatCapabilityConfirmation(proposal: CapabilityProposal): string {
  const args = Object.entries(proposal.args)
    .filter(([key]) => key !== 'password')
    .map(([key, value]) => key === 'command' ? value : key + ': ' + value)
    .join(', ');
  return proposal.capability.title + ' requested' + (args ? ' (' + args + ')' : '') + '. Confirm before I run this action.';
}
