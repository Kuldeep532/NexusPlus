export type RemoteComputerPlatform = 'windows' | 'ubuntu' | 'macos';

export type RemoteComputerConnectionStatus =
  | 'offline'
  | 'connecting'
  | 'paired'
  | 'connected'
  | 'locked'
  | 'error';

export type RemoteComputerCapability =
  | 'screen'
  | 'keyboard'
  | 'pointer'
  | 'clipboard'
  | 'audio'
  | 'voice-command'
  | 'screen-reader'
  | 'unlock';

export type ScreenReaderKind = 'nvda' | 'orca' | 'voiceover' | 'none' | 'unknown';

export interface RemoteComputer {
  id: string;
  name: string;
  platform: RemoteComputerPlatform;
  status: RemoteComputerConnectionStatus;
  screenReader: ScreenReaderKind;
  capabilities: RemoteComputerCapability[];
  pairedAt?: string;
  lastSeenAt?: string;
}

export interface RemoteComputerPairingChallenge {
  computerId: string;
  challengeId: string;
  challenge: string;
  expiresAt: string;
}

export interface RemoteComputerUnlockRequest {
  computerId: string;
  challengeId: string;
  signedChallenge: string;
  deviceKeyId: string;
  biometricStrength: 'strong' | 'weak';
}

export interface RemoteComputerUnlockResult {
  success: boolean;
  reason?:
    | 'not-paired'
    | 'expired'
    | 'invalid-signature'
    | 'computer-offline'
    | 'computer-policy-denied'
    | 'unsupported';
}

export interface RemoteComputerVoiceCommand {
  commandId: string;
  transcript: string;
  locale: string;
  confidence?: number;
}

export type RemoteComputerCommand =
  | { type: 'keyboard'; action: 'press'; key: string; modifiers?: string[] }
  | { type: 'pointer'; action: 'move' | 'click' | 'double-click'; x?: number; y?: number; button?: 'left' | 'right' | 'middle' }
  | { type: 'clipboard'; action: 'read' | 'write'; text?: string }
  | { type: 'screen-reader'; action: 'read-current' | 'pause' | 'resume' | 'next' | 'previous' }
  | { type: 'system'; action: 'lock' | 'sleep' };

export interface RemoteComputerCommandRequest {
  commandId: string;
  computerId: string;
  command: RemoteComputerCommand;
  source: 'voice' | 'touch';
  transcript?: string;
}

export interface RemoteComputerCommandResult {
  commandId: string;
  ok: boolean;
  output?: string;
  error?: 'not-paired' | 'unsupported' | 'policy-denied' | 'invalid-command' | 'execution-failed';
}
