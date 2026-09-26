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

const COMMAND_PATTERNS: Array<{
  id: string;
  pattern: RegExp;
  reason: string;
  args: (match: RegExpExecArray) => Record<string, string>;
}> = [
  { id: 'battery-status', pattern: /(?:battery|बैटरी)/i, reason: 'The user appears to be asking for battery state.', args: () => ({}) },
  { id: 'device-info', pattern: /(?:device information|phone info|डिवाइस|फोन की जानकारी)/i, reason: 'The request appears to ask for basic device information.', args: () => ({}) },
  { id: 'open-url', pattern: /(?:open|खोलो|खोलना)\s+(https?:\/\/\S+)/i, reason: 'The user requested opening a specific URL.', args: (match) => ({ url: match[1] }) },
  { id: 'create-reminder', pattern: /(?:remind me|reminder|याद दिलाना|रिमाइंडर)/i, reason: 'The request appears to create a reminder.', args: () => ({}) },
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
