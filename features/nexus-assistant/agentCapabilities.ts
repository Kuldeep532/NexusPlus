export type CapabilityRisk = 'safe' | 'confirm' | 'blocked';

export type AssistantCapabilityId =
  | 'device-info'
  | 'battery-status'
  | 'open-app'
  | 'open-url'
  | 'create-reminder'
  | 'set-alarm'
  | 'calendar-event'
  | 'read-local-file'
  | 'share-local-file'
  | 'play-media'
  | 'music-apps'
  | 'pdf-lock'
  | 'pdf-unlock'
  | 'pdf-compress'
  | 'pdf-rotate'
  | 'qr-generate'
  | 'tool-open';

export type AssistantCapability = {
  id: AssistantCapabilityId;
  title: string;
  description: string;
  risk: CapabilityRisk;
  requiresConfirmation: boolean;
  offline: boolean;
};

export const ASSISTANT_CAPABILITIES: readonly AssistantCapability[] = [
  { id: 'device-info', title: 'Device information', description: 'Read basic device state without changing anything.', risk: 'safe', requiresConfirmation: false, offline: true },
  { id: 'battery-status', title: 'Battery status', description: 'Read current battery level and charging state.', risk: 'safe', requiresConfirmation: false, offline: true },
  { id: 'open-app', title: 'Open an app', description: 'Launch an installed application through its supported Android deep link or package mapping.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'open-url', title: 'Open a link', description: 'Open a user-requested URL in the system browser.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'create-reminder', title: 'Create a reminder', description: 'Create a local reminder from natural-language time and message details.', risk: 'safe', requiresConfirmation: false, offline: true },
  { id: 'set-alarm', title: 'Set an alarm', description: 'Schedule a user-requested Android alarm at a specific time.', risk: 'safe', requiresConfirmation: false, offline: true },
  { id: 'calendar-event', title: 'Add a calendar event', description: 'Prepare an Android calendar event with title and time details.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'read-local-file', title: 'Read a local file', description: 'Read a file that the user explicitly selected for the assistant.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'share-local-file', title: 'Share a local file', description: 'Open the system share sheet for a user-selected local file.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'play-media', title: 'Play media', description: 'Start playback through an existing Nexus media action.', risk: 'safe', requiresConfirmation: false, offline: true },
  { id: 'music-apps', title: 'Music apps', description: 'Choose an installed music app and control compatible playback through Android media intents.', risk: 'safe', requiresConfirmation: false, offline: true },
  { id: 'pdf-lock', title: 'Lock PDF', description: 'Password-protect a selected local PDF using the existing native PDF engine.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'pdf-unlock', title: 'Unlock PDF', description: 'Remove protection from a selected local PDF using its password and the existing native engine.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'pdf-compress', title: 'Compress PDF', description: 'Compress a selected local PDF with the existing native PDF engine.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'pdf-rotate', title: 'Rotate PDF', description: 'Rotate a selected local PDF with the existing native PDF engine.', risk: 'confirm', requiresConfirmation: true, offline: true },
  { id: 'qr-generate', title: 'Generate QR Code', description: 'Generate a QR code using the existing QR generator and its supported payload types.', risk: 'safe', requiresConfirmation: false, offline: true },
  { id: 'tool-open', title: 'Open Nexus Tool', description: 'Open a registered Nexus Plus tool from the shared feature registry.', risk: 'safe', requiresConfirmation: false, offline: true },
];

const capabilityMap = new Map(ASSISTANT_CAPABILITIES.map((capability) => [capability.id, capability]));

export function getAssistantCapabilities(): readonly AssistantCapability[] { return ASSISTANT_CAPABILITIES; }
export function getAssistantCapability(id: string): AssistantCapability | null { return capabilityMap.get(id as AssistantCapabilityId) ?? null; }
export function isCapabilityAllowed(id: string): boolean { return Boolean(getAssistantCapability(id) && getAssistantCapability(id)?.risk !== 'blocked'); }
export function requiresCapabilityConfirmation(id: string): boolean { return getAssistantCapability(id)?.requiresConfirmation ?? true; }
