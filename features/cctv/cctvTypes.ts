export type CctvProtocol = 'onvif' | 'rtsp' | 'http' | 'unknown';
export type CctvDeviceKind = 'ip_camera' | 'network_camera' | 'dvr' | 'nvr';
export type CctvAuthFieldKind = 'name' | 'username' | 'password' | 'pin' | 'token' | 'passcode';
export interface CctvAuthFieldDefinition { id: CctvAuthFieldKind; label: string; required: boolean; secret?: boolean; }
export type CctvAuthenticationProfileId = 'name_username_password' | 'username_password' | 'pin' | 'token' | 'passcode' | 'custom';
export interface CctvAuthenticationProfile { id: CctvAuthenticationProfileId; fields: CctvAuthFieldDefinition[]; source: 'qr' | 'serial' | 'manual' | 'protocol'; confidence: 'verified' | 'detected' | 'default'; }
export interface CctvSecurityProfile {
  secureTransport: boolean;
  authenticated: boolean;
  protocolFamily: 'onvif' | 'unknown';
  securityLevel: 'verified' | 'detected' | 'rejected';
  reason?: string;
}

/** Runtime capabilities proven by the authenticated native handshake. */
export interface CctvCapabilities {
  liveView: boolean;
  recordings: boolean;
  playback: boolean;
  panTiltZoom: boolean;
}

export type CctvCapabilityKey = keyof CctvCapabilities;
export type CctvCameraControl = 'ptz' | 'playback';

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
  securityProfile?: CctvSecurityProfile;
}
export type CctvLocalSecrets = { username: string; password: string };
export type CctvDiscoveryMode = 'qr' | 'serial' | 'lan' | 'manual';

export const CCTV_CAPABILITY_LABELS: Record<CctvCapabilityKey, string> = {
  liveView: 'Live View',
  recordings: 'Recording',
  playback: 'Playback',
  panTiltZoom: 'PTZ',
};
