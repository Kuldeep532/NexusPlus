export type CapabilityRisk = 'safe' | 'confirm' | 'blocked';

export type AssistantCapabilityId =
  | 'device-info'
  | 'battery-status'
  | 'open-app'
  | 'open-url'
  | 'create-reminder'
  | 'read-local-file'
  | 'share-local-file'
  | 'play-media'
  | 'computer-discover'
  | 'computer-status'
  | 'computer-open-url'
  | 'computer-open-file'
  | 'computer-launch-app';

export type AssistantCapability = {
  id: AssistantCapabilityId;
  title: string;
  description: string;
  risk: CapabilityRisk;
  requiresConfirmation: boolean;
  offline: boolean;
};

/**
 * Mobile capability registry. Computer actions are delegated to an explicitly paired
 * Nexus Computer Agent on the local network; the phone never executes arbitrary OS commands.
 */
export const ASSISTANT_CAPABILITIES: readonly AssistantCapability[] = [
  { id: 'device-info', title: 'Device information', description: 'Read basic device state without changing anything.', risk: 'safe', requiresConfirmation: false, offline: true },
  { id: 'battery-status', title: 'Battery status', description: 'Read current battery level and charging state.', risk: 'safe', requiresConfirmation: false, offline: true },
  { id: 'open-app', title: 'Open an app', description: 'Launch an installed application through its supported deep link.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'open-url', title: 'Open a link', description: 'Open a user-requested URL in the system browser.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'create-reminder', title: 'Create a reminder', description: 'Create a reminder after the user confirms the exact details.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'read-local-file', title: 'Read a local file', description: 'Read a file that the user explicitly selected for the assistant.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'share-local-file', title: 'Share a local file', description: 'Open the system share sheet for a user-selected local file.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'play-media', title: 'Play media', description: 'Start playback through an existing Nexus media action.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'computer-discover', title: 'Find my computer', description: 'Find a Nexus Computer Agent reachable on the local network.', risk: 'safe', requiresConfirmation: false, offline: false },
  { id: 'computer-status', title: 'Computer status', description: 'Read status and basic platform information from a paired computer.', risk: 'safe', requiresConfirmation: false, offline: false },
  { id: 'computer-open-url', title: 'Open a URL on computer', description: 'Open a URL using the computer operating system default browser.', risk: 'confirm', requiresConfirmation: true, offline: false },
  { id: 'computer-open-file', title: 'Open a file on computer', description: 'Open a user-selected file using the computer operating system default application.', risk: 'confirm', requiresConfirmation: true, offline: false },
  { id: 'computer-launch-app', title: 'Launch a computer app', description: 'Launch an allow-listed desktop application using the computer operating system.', risk: 'confirm', requiresConfirmation: true, offline: false },
];

const capabilityMap = new Map(ASSISTANT_CAPABILITIES.map((capability) => [capability.id, capability]));

export function getAssistantCapabilities(): readonly AssistantCapability[] {
  return ASSISTANT_CAPABILITIES;
}

export function getAssistantCapability(id: string): AssistantCapability | null {
  return capabilityMap.get(id as AssistantCapabilityId) ?? null;
}

export function isCapabilityAllowed(id: string): boolean {
  const capability = getAssistantCapability(id);
  return Boolean(capability && capability.risk !== 'blocked');
}

export function requiresCapabilityConfirmation(id: string): boolean {
  return getAssistantCapability(id)?.requiresConfirmation ?? true;
}
