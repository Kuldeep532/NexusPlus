import {
  getAssistantCapability,
  requiresCapabilityConfirmation,
  type AssistantCapability,
} from './agentCapabilities';
import { parseAssistantPdfCommand } from './pdfAssistantCommands';
import { searchAssistantTools } from './assistantToolAdapter';
import { parseMusicIntent } from './musicIntent';
import { parseNaturalCommand } from './naturalCommandParser';
import { findNexusElizaAction } from './elizaAgentPlugin';

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
  const meridiem = match[3]?.toLowerCase().replace(/\./g, '');
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function parseRelativeMinutes(text: string): number | null {
  const match = /(?:in|after|within|में|बाद)\s*(\d+(?:\.\d+)?)\s*(minute|minutes|min|mins|मिनट|hour|hours|hr|hrs|घंटे|घंटा)/i.exec(text);
  if (!match) {
    if (/\b(?:in|after|within)\s+(?:half an hour|half hour)\b/i.test(text)) return 30;
    return null;
  }
  const value = Math.max(0.1, Number(match[1]));
  return /hour|hr|hrs|घंटे|घंटा/i.test(match[2]) ? Math.max(1, Math.round(value * 60)) : Math.max(1, Math.round(value));
}

function cleanReminderText(text: string): string {
  let value = text.trim();
  value = value.replace(/^\s*(?:remind me|reminder|please remind me|remember to|don't let me forget|do not let me forget|याद दिलाना|रिमाइंडर|मुझे याद दिलाना)\s*/i, '');
  value = value.replace(/\b(?:at|around|by|for|on|पर|को|लगभग)\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\b/i, '');
  value = value.replace(/\b\d{1,2}(?::\d{2})?\s*(?:in the|in)?\s*(?:morning|afternoon|evening|night)\b/i, '');
  value = value.replace(/\b(?:in|after|within|में|बाद)\s*\d+(?:\.\d+)?\s*(?:minute|minutes|min|mins|मिनट|hour|hours|hr|hrs|घंटे|घंटा)\b/i, '');
  value = value.replace(/\b(?:in|after|within)\s+(?:half an hour|half hour)\b/i, '');
  value = value.replace(/^[,;:\-]+|[,;:\-]+$/g, '');
  return value.replace(/\s+/g, ' ').trim() || 'Nexus Assistant reminder';
}

function proposalForCapability(id: AssistantCapability['id'], args: Record<string, string>, reason: string): CapabilityProposal | null {
  const capability = getAssistantCapability(id);
  if (!capability) return null;
  return {
    capability,
    args,
    requiresConfirmation: requiresCapabilityConfirmation(id),
    reason,
  };
}

export function planCapability(request: string): CapabilityProposal | null {
  const pdf = parseAssistantPdfCommand(request);
  if (pdf) {
    const id = pdf.kind === 'lock' ? 'pdf-lock'
      : pdf.kind === 'unlock' ? 'pdf-unlock'
      : pdf.kind === 'compress' ? 'pdf-compress'
      : pdf.kind === 'rotate' ? 'pdf-rotate'
      : null;
    if (id) {
      const args: Record<string, string> = { command: pdf.kind };
      if (pdf.kind === 'compress') args.quality = String(pdf.quality);
      if (pdf.kind === 'rotate') args.degrees = String(pdf.degrees);
      return proposalForCapability(id, args, 'The user requested a PDF operation on a selected local PDF.');
    }
  }

  const text = request.trim();
  if (!text) return null;

  const natural = parseNaturalCommand(text);
  if (natural.kind === 'reminder') {
    return proposalForCapability(
      'create-reminder',
      {
        ...(natural.hour !== undefined ? { hour: String(natural.hour), minute: String(natural.minute ?? 0) } : {}),
        ...(natural.delayMinutes !== undefined ? { delayMinutes: String(natural.delayMinutes) } : {}),
        message: natural.text ?? 'Nexus Assistant reminder',
      },
      'ElizaOS action semantics matched a natural-language reminder and extracted its time/message slots.',
    );
  }

  if (natural.kind === 'alarm') {
    if (natural.hour === undefined) return null;
    return proposalForCapability(
      'set-alarm',
      { hour: String(natural.hour), minute: String(natural.minute ?? 0) },
      'ElizaOS capability semantics matched a natural-language alarm and extracted its time slots.',
    );
  }

  if (natural.kind === 'calendar') {
    return proposalForCapability(
      'calendar-event',
      { title: natural.text ?? text },
      'ElizaOS capability semantics matched a calendar/event request.',
    );
  }

  if (natural.kind === 'open-url' && natural.target) {
    return proposalForCapability(
      'open-url',
      { url: natural.target },
      'ElizaOS capability semantics matched a direct URL action.',
    );
  }

  const music = parseMusicIntent(text);
  if (music) {
    return proposalForCapability(
      'play-media',
      {
        action: music.action,
        ...(music.query ? { query: music.query } : {}),
      },
      'ElizaOS capability semantics matched a direct media action.',
    );
  }

  const qrRequest = /(?:qr|qrcode|qr code|क्यूआर|क्यूआर कोड|upi qr|wifi qr|whatsapp qr)/i.test(text);
  if (qrRequest) {
    return proposalForCapability('qr-generate', { query: text }, 'ElizaOS capability semantics matched a QR generation request.');
  }

  const tool = searchAssistantTools(text).find((item) => item.id !== 'qr-code' && item.kind === 'route');
  if (tool) {
    return proposalForCapability('tool-open', { toolId: tool.id, route: tool.route ?? '' }, 'ElizaOS capability semantics matched a registered Nexus Plus tool.');
  }


  const elizaAction = findNexusElizaAction(text);
  if (elizaAction) {
    switch (elizaAction.id) {
      case 'CREATE_REMINDER': {
        const minutes = parseRelativeMinutes(text);
        const clock = parseClockTime(text);
        return proposalForCapability('create-reminder', {
          ...(minutes ? { delayMinutes: String(minutes) } : {}),
          ...(clock ? { hour: String(clock.hour), minute: String(clock.minute) } : {}),
          message: cleanReminderText(text),
        }, 'ElizaOS action registry matched the reminder intent.');
      }
      case 'SET_ALARM': {
        const clock = parseClockTime(text);
        return clock
          ? proposalForCapability('set-alarm', { hour: String(clock.hour), minute: String(clock.minute) }, 'ElizaOS action registry matched the alarm intent.')
          : null;
      }
      case 'CREATE_CALENDAR_EVENT':
        return proposalForCapability('calendar-event', { title: text }, 'ElizaOS action registry matched the calendar intent.');
      case 'OPEN_URL': {
        const url = /https?:\/\/\\S+/i.exec(text)?.[0];
        return url ? proposalForCapability('open-url', { url }, 'ElizaOS action registry matched the URL action.') : null;
      }
      case 'GENERATE_QR':
        return proposalForCapability('qr-generate', { query: text }, 'ElizaOS action registry matched the QR action.');
      case 'OPEN_TOOL': {
        const matchedTool = searchAssistantTools(text).find((item) => item.kind === 'route');
        return matchedTool
          ? proposalForCapability('tool-open', { toolId: matchedTool.id, route: matchedTool.route ?? '' }, 'ElizaOS action registry matched the Nexus tool action.')
          : null;
      }
      case 'PLAY_MUSIC':
      case 'PAUSE_MUSIC':
      case 'RESUME_MUSIC':
      case 'NEXT_MUSIC':
      case 'PREVIOUS_MUSIC':
      case 'STOP_MUSIC': {
        const intent = parseMusicIntent(text);
        return intent
          ? proposalForCapability('play-media', { action: intent.action, ...(intent.query ? { query: intent.query } : {}) }, 'ElizaOS action registry matched the music action.')
          : null;
      }
      case 'OPEN_APP':
        return null;
      default:
        return null;
    }
  }

  // Keep the ElizaOS catalog imported and available as the semantic action registry.
  // The actual execution still occurs through planCapability -> stage3Agent -> executor.
  void getNexusElizaPlugins;

  const battery = /(?:battery|बैटरी)/i.test(text);
  if (battery) return proposalForCapability('battery-status', {}, 'The request asks for battery state.');

  const device = /(?:device information|phone info|डिवाइस|फोन की जानकारी)/i.test(text);
  if (device) return proposalForCapability('device-info', {}, 'The request asks for basic device information.');

  const url = /(?:open|खोलो|खोलना)\s+(https?:\/\/\S+)/i.exec(text);
  if (url) return proposalForCapability('open-url', { url: url[1] }, 'The user requested opening a specific URL.');

  const reminderFallback = /(?:remind|reminder|remember|याद|रिमाइंडर)/i.test(text);
  if (reminderFallback) {
    const minutes = parseRelativeMinutes(text);
    const clock = parseClockTime(text);
    return proposalForCapability(
      'create-reminder',
      {
        ...(minutes ? { delayMinutes: String(minutes) } : {}),
        ...(clock ? { hour: String(clock.hour), minute: String(clock.minute) } : {}),
        message: cleanReminderText(text),
      },
      'Reminder fallback matched by the registered Nexus capability catalog.',
    );
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
