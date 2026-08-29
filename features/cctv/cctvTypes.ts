export type CctvProtocol = 'onvif' | 'rtsp' | 'http' | 'unknown';

export type CctvDeviceKind = 'ip_camera' | 'network_camera' | 'dvr' | 'nvr';

export type CctvAuthFieldKind = 'name' | 'username' | 'password' | 'pin' | 'token' | 'passcode';

export interface CctvAuthFieldDefinition { id: CctvAuthFieldKind; label: string; required: boolean; secret?: boolean; }
export type CctvAuthenticationProfileId = 'name_username_password' | 'username_password' | 'pin' | 'token' | 'passcode' | 'custom';
export interface CctvAuthenticationProfile { id: CctvAuthenticationProfileId; fields: CctvAuthFieldDefinition[]; source: 'qr' | 'serial' | 'manual' | 'protocol'; confidence: 'verified' | 'detected' | 'default'; }

export interface CctvCapabilities {
  liveView: boolean;
  audio: boolean;
  recordings: boolean;
  playback: boolean;
  eraseData: boolean;
  passwordChange: boolean;
  discovery: boolean;
  multiCamera: boolean;
  switchCamera: boolean;
  flip: boolean;
  panTiltZoom: boolean;
  nightVision: boolean;
  talk: boolean;
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
  authenticationProfile?: CctvAuthenticationProfile;
}

export type CctvDiscoveryMode = 'qr' | 'serial' | 'manual';
