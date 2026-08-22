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
