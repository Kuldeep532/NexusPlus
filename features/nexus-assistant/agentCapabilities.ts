export type CapabilityRisk = 'safe' | 'confirm' | 'blocked';

export type AssistantCapabilityId =
  | 'device-info'
  | 'battery-status'
  | 'open-app'
  | 'open-url'
  | 'create-reminder'
  | 'read-local-file'
  | 'share-local-file'
  | 'play-media';

export type AssistantCapability = {
  id: AssistantCapabilityId;
  title: string;
  description: string;
  risk: CapabilityRisk;
  requiresConfirmation: boolean;
  offline: boolean;
};

/**
 * Mobile capability registry inspired by agent/plugin architectures, but deliberately
 * narrow: the model may propose a capability, while the app decides whether it may run.
 */
export const ASSISTANT_CAPABILITIES: readonly AssistantCapability[] = [
  {
    id: 'device-info',
    title: 'Device information',
    description: 'Read basic device state without changing anything.',
    risk: 'safe',
    requiresConfirmation: false,
    offline: true,
  },
  {
    id: 'battery-status',
    title: 'Battery status',
    description: 'Read current battery level and charging state.',
    risk: 'safe',
    requiresConfirmation: false,
    offline: true,
  },
  {
    id: 'open-app',
    title: 'Open an app',
    description: 'Launch an installed application through its supported deep link.',
    risk: 'confirm',
    requiresConfirmation: true,
    offline: true,
  },
  {
    id: 'open-url',
    title: 'Open a link',
    description: 'Open a user-requested URL in the system browser.',
    risk: 'confirm',
    requiresConfirmation: true,
    offline: true,
  },
  {
    id: 'create-reminder',
    title: 'Create a reminder',
    description: 'Create a reminder after the user confirms the exact details.',
    risk: 'confirm',
    requiresConfirmation: true,
    offline: true,
  },
  {
    id: 'read-local-file',
    title: 'Read a local file',
    description: 'Read a file that the user explicitly selected for the assistant.',
    risk: 'confirm',
    requiresConfirmation: true,
    offline: true,
  },
  {
    id: 'share-local-file',
    title: 'Share a local file',
    description: 'Open the system share sheet for a user-selected local file.',
    risk: 'confirm',
    requiresConfirmation: true,
    offline: true,
  },
  {
    id: 'play-media',
    title: 'Play media',
    description: 'Start playback through an existing Nexus media action.',
    risk: 'confirm',
    requiresConfirmation: true,
    offline: true,
  },
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
