export type Platform = 'windows' | 'macos' | 'ubuntu';
export type ScreenReader = 'nvda' | 'orca' | 'voiceover' | 'none' | 'unknown';
export type CommandSource = 'voice' | 'touch';

export type RemoteCommand =
  | { type: 'keyboard'; action: 'press'; key: string; modifiers?: string[] }
  | { type: 'pointer'; action: 'move' | 'click' | 'double-click'; x?: number; y?: number; button?: 'left' | 'right' | 'middle' }
  | { type: 'clipboard'; action: 'read' | 'write'; text?: string }
  | { type: 'screen-reader'; action: 'read-current' | 'pause' | 'resume' | 'next' | 'previous' }
  | { type: 'system'; action: 'lock' | 'sleep' };

export interface CommandEnvelope {
  commandId: string;
  computerId: string;
  source: CommandSource;
  transcript?: string;
  command: RemoteCommand;
}

export interface AgentCapabilities {
  platform: Platform;
  screenReader: ScreenReader;
  keyboard: boolean;
  pointer: boolean;
  clipboard: boolean;
  voice: boolean;
  audio: boolean;
  screen: boolean;
  lock: boolean;
  unlock: boolean;
}

export interface PairingRequest { publicKey: string; keyId: string; nonce: string; }
export interface PairingResponse { computerId: string; computerName: string; platform: Platform; pairingCode: string; publicKey: string; }
