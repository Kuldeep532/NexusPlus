export type CctvProtocol = 'onvif' | 'rtsp' | 'http' | 'unknown';

export interface CctvCapabilities {
  liveView: boolean;
  audio: boolean;
  recordings: boolean;
  playback: boolean;
  eraseData: boolean;
  passwordChange: boolean;
  discovery: boolean;
}

export interface CctvCamera {
  id: string;
  name: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  protocol: CctvProtocol;
  host?: string;
  port?: number;
  username: string;
  passwordRef: string;
  createdAt: number;
  updatedAt: number;
  capabilities: CctvCapabilities;
}

export type CctvDiscoveryMode = 'qr' | 'serial' | 'manual';
