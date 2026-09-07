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
  { id: 'battery-status', pattern: /(?:battery|बैटरी)/i, reason: 'The user appears to be asking for battery state.', args: () => ({}) },
  { id: 'device-info', pattern: /(?:device information|phone info|डिवाइस|फोन की जानकारी)/i, reason: 'The request appears to ask for basic device information.', args: () => ({}) },
  { id: 'open-url', pattern: /(?:open|खोलो|खोलना)\s+(https?:\/\/\S+)/i, reason: 'The user requested opening a specific URL.', args: (match) => ({ url: match[1] }) },
  { id: 'create-reminder', pattern: /(?:remind me|reminder|याद दिलाना|रिमाइंडर)/i, reason: 'The request appears to create a reminder.', args: () => ({}) },
  { id: 'computer-status', pattern: /(?:computer status|pc status|desktop status|कंप्यूटर स्टेटस|कंप्यूटर की जानकारी|पीसी स्टेटस)/i, reason: 'The user is asking for the connected computer status.', args: () => ({}) },
  { id: 'computer-open-url', pattern: /(?:open|खोलो|खोलना)\s+(https?:\/\/\S+)\s+(?:on|में|पर)\s+(?:my\s+)?(?:computer|pc|desktop|कंप्यूटर|पीसी)/i, reason: 'The user requested opening a URL on the connected computer.', args: (match) => ({ url: match[1] }) },
  { id: 'computer-open-file', pattern: /(?:open|खोलो|खोलना)\s+(?:file|फ़ाइल)\s+(.+)/i, reason: 'The user requested opening a file on the connected computer.', args: (match) => ({ path: match[1].trim() }) },
  { id: 'computer-launch-app', pattern: /(?:launch|start|open|चलाओ|खोलो)\s+(?:app|application|software)?\s*(.+?)\s+(?:on|में|पर)\s+(?:my\s+)?(?:computer|pc|desktop|कंप्यूटर|पीसी)/i, reason: 'The user requested launching an application on the connected computer.', args: (match) => ({ app: match[1].trim() }) },
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
