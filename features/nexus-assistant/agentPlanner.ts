import {
  getAssistantCapability,
  requiresCapabilityConfirmation,
  type AssistantCapability,
} from './agentCapabilities';

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
  {
    id: 'battery-status',
    pattern: /(?:battery|बैटरी)/i,
    reason: 'The user appears to be asking for battery state.',
    args: () => ({}),
  },
  {
    id: 'device-info',
    pattern: /(?:device information|phone info|डिवाइस|फोन की जानकारी)/i,
    reason: 'The request appears to ask for basic device information.',
    args: () => ({}),
  },
  {
    id: 'open-url',
    pattern: /(?:open|खोलो|खोलना)\s+(https?:\/\/\S+)/i,
    reason: 'The user requested opening a specific URL.',
    args: (match) => ({ url: match[1] }),
  },
  {
    id: 'create-reminder',
    pattern: /(?:remind me|reminder|याद दिलाना|रिमाइंडर)/i,
    reason: 'The request appears to create a reminder.',
    args: () => ({}),
  },
];

export function planCapability(request: string): CapabilityProposal | null {
  const text = request.trim();
  if (!text) return null;

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
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  return `${proposal.capability.title} requested${args ? ` (${args})` : ''}. Confirm before I run this action.`;
}
