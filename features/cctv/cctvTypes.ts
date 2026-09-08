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

/**
 * Capabilities are a device contract, not app defaults. `true` means the
 * authorized camera handshake explicitly confirmed that operation. `false`
 * means the feature must remain unavailable in the UI and command layer.
 */
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

export type CctvCapabilityKey = keyof CctvCapabilities;
export type CctvCameraControl = 'sound' | 'switch_camera' | 'flip' | 'ptz' | 'night_vision' | 'talk' | 'playback';

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
  audio: 'Sound',
  recordings: 'Recording',
  playback: 'Playback',
  eraseData: 'Erase Data',
  passwordChange: 'Password Change',
  discovery: 'Discovery',
  multiCamera: 'Multi-camera',
  switchCamera: 'Switch Camera',
  flip: 'Flip',
  panTiltZoom: 'PTZ',
  nightVision: 'Night Vision',
  talk: 'Talk',
};
