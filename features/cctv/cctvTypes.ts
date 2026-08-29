export type CctvProtocol = 'onvif' | 'rtsp' | 'http' | 'unknown';

export type CctvDeviceKind = 'ip_camera' | 'network_camera' | 'dvr' | 'nvr';

export interface CctvCapabilities {
  liveView: boolean;
  audio: boolean;
  recordings: boolean;
  playback: boolean;
  eraseData: boolean;
  passwordChange: boolean;
  discovery: boolean;
  multiCamera: boolean;
}

export interface CctvCamera {
  id: string;
  name: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  protocol: CctvProtocol;
  deviceKind?: CctvDeviceKind;
  host?: string;
  port?: number;
  username: string;
  passwordRef: string;
  createdAt: number;
  updatedAt: number;
  capabilities: CctvCapabilities;
}

export type CctvDiscoveryMode = 'qr' | 'serial' | 'manual';
