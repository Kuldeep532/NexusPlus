import { NativeModules, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { CctvCapabilities, CctvCamera } from './cctvTypes';

const SCHEMA_VERSION = 3;
const CAMERA_ID_PREFIX = 'nexus_plus_cctv_camera_';
const SECRET_PREFIX = 'nexus_plus_cctv_secret_';
const SESSION_PREFIX = 'nexus_plus_cctv_session_';

type NativeOnvifBridge = {
  connect(cameraId: string, host: string, port: number, username: string, password: string, secure: boolean, capabilities: CctvCapabilities): Promise<{ sessionId: string; transport: string; authenticated: boolean; securityLevel: string }>;
  disconnect(sessionId: string): Promise<void>;
  control(sessionId: string, control: string, payload?: Record<string, unknown>): Promise<void>;
  getAuthorizedCapabilities(sessionId: string): Promise<Record<string, boolean>>;
};

export type CctvConnectionState = 'idle' | 'discovering' | 'connecting' | 'connected' | 'recording' | 'error';
export type CctvErrorCode = 'INVALID_INPUT' | 'UNSUPPORTED_PROTOCOL' | 'NOT_IMPLEMENTED' | 'AUTH_REQUIRED' | 'AUTH_FAILED' | 'NETWORK_UNAVAILABLE' | 'NOT_FOUND' | 'OPERATION_UNSUPPORTED' | 'OPERATION_FAILED';
export type CctvBackendErrorShape = { code: CctvErrorCode; message: string; retryable: boolean };
export class CctvBackendError extends Error { readonly code: CctvErrorCode; readonly retryable: boolean; constructor(shape: CctvBackendErrorShape) { super(shape.message); this.name = 'CctvBackendError'; this.code = shape.code; this.retryable = shape.retryable; } }
export interface CctvCameraRecord extends CctvCamera { schemaVersion: number; connectionState: CctvConnectionState; lastConnectedAt?: number; lastErrorCode?: CctvErrorCode; }
export interface CctvSession { id: string; cameraId: string; state: Exclude<CctvConnectionState, 'idle' | 'error'>; startedAt: number; expiresAt: number; }
export interface CctvTransportContext { camera: CctvCameraRecord; session: CctvSession; capabilities: CctvCapabilities; nativeSessionId?: string; }
export interface CctvProtocolAdapter { readonly protocol: CctvCamera['protocol']; discover(): Promise<CctvCameraRecord[]>; connect(camera: CctvCameraRecord): Promise<CctvTransportContext>; disconnect(context: CctvTransportContext): Promise<void>; startLiveView(context: CctvTransportContext): Promise<void>; stopLiveView(context: CctvTransportContext): Promise<void>; startRecording(context: CctvTransportContext): Promise<void>; stopRecording(context: CctvTransportContext): Promise<void>; searchRecordings(context: CctvTransportContext, query: CctvRecordingSearch): Promise<CctvRecordingItem[]>; eraseData(context: CctvTransportContext, scope: CctvEraseScope): Promise<void>; changePassword(context: CctvTransportContext, currentPassword: string, newPassword: string): Promise<void>; setControl(context: CctvTransportContext, control: CctvCameraControl, payload?: Record<string, unknown>): Promise<void>; }
export type CctvCameraControl = 'sound' | 'switch_camera' | 'flip' | 'ptz' | 'night_vision' | 'talk';
export interface CctvRecordingSearch { from: number; to: number; query?: string; limit?: number; }
export interface CctvRecordingItem { id: string; cameraId: string; startedAt: number; endedAt: number; label?: string; }
export type CctvEraseScope = 'all_recordings' | 'selected_recording';
export type CctvCredentialStore = { save(cameraId: string, username: string, password: string): Promise<void>; read(cameraId: string): Promise<{ username: string; password: string } | null>; withCredentials<T>(cameraId: string, operation: (credentials: { username: string; password: string }) => Promise<T>): Promise<T>; remove(cameraId: string): Promise<void>; };

const CREDENTIAL_OPTIONS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY, requireAuthentication: true };
function ensureNonEmpty(value: string, field: string): string { const normalized = value.trim(); if (!normalized) throw new CctvBackendError({ code: 'INVALID_INPUT', message: `${field} is required.`, retryable: false }); return normalized; }
function validatePassword(password: string, field: string): string { const normalized = ensureNonEmpty(password, field); if (normalized.length < 6) throw new CctvBackendError({ code: 'INVALID_INPUT', message: `${field} is too short.`, retryable: false }); return normalized; }
async function digest(value: string): Promise<string> { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }

export const cctvCredentialStore: CctvCredentialStore = {
  async save(cameraId, username, password) { ensureNonEmpty(cameraId, 'Camera ID'); ensureNonEmpty(username, 'Username'); validatePassword(password, 'Password'); await SecureStore.setItemAsync(`${SECRET_PREFIX}${cameraId}`, JSON.stringify({ username, password }), CREDENTIAL_OPTIONS); },
  async read(cameraId) { ensureNonEmpty(cameraId, 'Camera ID'); const raw = await SecureStore.getItemAsync(`${SECRET_PREFIX}${cameraId}`, CREDENTIAL_OPTIONS); if (!raw) return null; try { const parsed = JSON.parse(raw) as { username?: unknown; password?: unknown }; if (typeof parsed.username !== 'string' || typeof parsed.password !== 'string') return null; return { username: parsed.username, password: parsed.password }; } catch { return null; } },
  async withCredentials<T>(cameraId: string, operation: (credentials: { username: string; password: string }) => Promise<T>): Promise<T> { const credentials = await this.read(cameraId); if (!credentials) throw new CctvBackendError({ code: 'AUTH_REQUIRED', message: 'Camera credentials are unavailable.', retryable: false }); return operation(credentials); },
  async remove(cameraId) { ensureNonEmpty(cameraId, 'Camera ID'); await SecureStore.deleteItemAsync(`${SECRET_PREFIX}${cameraId}`); },
};

export async function deriveStableCameraId(input: { manufacturer?: string; serialNumber?: string; username: string }): Promise<string> { const identity = [input.manufacturer?.trim().toLowerCase() ?? '', input.serialNumber?.trim().toLowerCase() ?? '', input.username.trim().toLowerCase()].join('|'); return `${CAMERA_ID_PREFIX}${await digest(identity)}`; }
export function sanitizeNetworkField(value: string | undefined): string | undefined { const normalized = value?.trim(); return normalized || undefined; }
export function sanitizeCameraForPersistence(camera: CctvCamera): CctvCameraRecord { return { ...camera, name: ensureNonEmpty(camera.name, 'Camera name'), username: ensureNonEmpty(camera.username, 'Username'), passwordRef: ensureNonEmpty(camera.passwordRef, 'Password reference'), host: undefined, port: undefined, schemaVersion: SCHEMA_VERSION, connectionState: 'idle' }; }
export function validateRecordingSearch(query: CctvRecordingSearch): CctvRecordingSearch { if (!Number.isFinite(query.from) || !Number.isFinite(query.to) || query.to < query.from) throw new CctvBackendError({ code: 'INVALID_INPUT', message: 'Recording time range is invalid.', retryable: false }); const limit = query.limit === undefined ? 50 : Math.min(Math.max(Math.trunc(query.limit), 1), 200); return { ...query, limit }; }
export function assertCapability(camera: CctvCamera, capability: keyof CctvCapabilities): void { if (!camera.capabilities[capability]) throw new CctvBackendError({ code: 'OPERATION_UNSUPPORTED', message: `Camera does not advertise ${capability} support.`, retryable: false }); }

export class OnvifCctvProtocolAdapter implements CctvProtocolAdapter {
  readonly protocol = 'onvif' as const;
  private readonly native: NativeOnvifBridge | null = Platform.OS === 'android' ? (NativeModules.NexusCctvOnvif as NativeOnvifBridge) : null;
  async discover(): Promise<CctvCameraRecord[]> { throw new CctvBackendError({ code: 'NOT_IMPLEMENTED', message: 'ONVIF discovery is authorized only through the QR/intent background flow.', retryable: false }); }
  async connect(camera: CctvCameraRecord): Promise<CctvTransportContext> {
    if (!camera.securityProfile || camera.securityProfile.securityLevel !== 'verified' || !camera.securityProfile.secureTransport || !camera.securityProfile.authenticated) throw new CctvBackendError({ code: 'AUTH_FAILED', message: 'Camera security verification did not pass.', retryable: false });
    if (Platform.OS !== 'android' || !this.native) throw new CctvBackendError({ code: 'NOT_IMPLEMENTED', message: 'Verified ONVIF control is currently available only on the Android native bridge.', retryable: false });
    const credentials = await cctvCredentialStore.read(camera.id);
    if (!credentials) throw new CctvBackendError({ code: 'AUTH_REQUIRED', message: 'Camera authorization is required.', retryable: false });
    if (!camera.host || !camera.port) throw new CctvBackendError({ code: 'NETWORK_UNAVAILABLE', message: 'Camera endpoint is unavailable.', retryable: true });
    const session = createSession(camera.id);
    try {
      const native = await this.native.connect(camera.id, camera.host, camera.port, credentials.username, credentials.password, true, camera.capabilities);
      return { camera: { ...camera, connectionState: 'connected', lastConnectedAt: Date.now() }, session, capabilities: camera.capabilities, nativeSessionId: native.sessionId };
    } catch (error) {
      throw new CctvBackendError({ code: 'AUTH_FAILED', message: error instanceof Error ? error.message : 'Camera authorization failed.', retryable: true });
    }
  }
  async disconnect(context: CctvTransportContext): Promise<void> { if (this.native && context.nativeSessionId) await this.native.disconnect(context.nativeSessionId); }
  private async control(context: CctvTransportContext, control: string, payload?: Record<string, unknown>): Promise<void> {
    if (!this.native || !context.nativeSessionId) throw new CctvBackendError({ code: 'NOT_IMPLEMENTED', message: 'Camera control transport is unavailable.', retryable: false });
    await this.native.control(context.nativeSessionId, control, payload);
  }
  async startLiveView(context: CctvTransportContext): Promise<void> { await this.control(context, 'start'); }
  async stopLiveView(context: CctvTransportContext): Promise<void> { await this.control(context, 'stop'); }
  async startRecording(context: CctvTransportContext): Promise<void> { assertCapability(context.camera, 'recordings'); await this.control(context, 'recording_start'); }
  async stopRecording(context: CctvTransportContext): Promise<void> { assertCapability(context.camera, 'recordings'); await this.control(context, 'recording_stop'); }
  async searchRecordings(context: CctvTransportContext, query: CctvRecordingSearch): Promise<CctvRecordingItem[]> { assertCapability(context.camera, 'playback'); await this.control(context, 'playback', { from: query.from, to: query.to, limit: query.limit ?? 50, query: query.query ?? '' }); return []; }
  async eraseData(context: CctvTransportContext, scope: CctvEraseScope): Promise<void> { assertCapability(context.camera, 'eraseData'); await this.control(context, 'erase_data', { scope }); }
  async changePassword(context: CctvTransportContext, currentPassword: string, newPassword: string): Promise<void> { assertCapability(context.camera, 'passwordChange'); validatePassword(currentPassword, 'Current password'); validatePassword(newPassword, 'New password'); await this.control(context, 'change_password'); }
  async setControl(context: CctvTransportContext, control: CctvCameraControl, payload?: Record<string, unknown>): Promise<void> { assertCapability(context.camera, control === 'sound' ? 'audio' : control === 'switch_camera' ? 'switchCamera' : control === 'flip' ? 'flip' : control === 'ptz' ? 'panTiltZoom' : control === 'night_vision' ? 'nightVision' : 'talk'); await this.control(context, control, payload); }
}

export function getCctvAdapter(protocol: CctvCamera['protocol']): CctvProtocolAdapter {
  if (protocol === 'onvif') return new OnvifCctvProtocolAdapter();
  return new UnsupportedCctvProtocolAdapter(protocol);
}
export class UnsupportedCctvProtocolAdapter implements CctvProtocolAdapter {
  constructor(public readonly protocol: CctvCamera['protocol']) {}
  private unsupported(): never { throw new CctvBackendError({ code: this.protocol === 'unknown' ? 'UNSUPPORTED_PROTOCOL' : 'NOT_IMPLEMENTED', message: 'This camera protocol does not have a verified production adapter yet.', retryable: false }); }
  async discover(): Promise<never> { return this.unsupported(); }
  async connect(): Promise<never> { return this.unsupported(); }
  async disconnect(): Promise<never> { return this.unsupported(); }
  async startLiveView(): Promise<never> { return this.unsupported(); }
  async stopLiveView(): Promise<never> { return this.unsupported(); }
  async startRecording(): Promise<never> { return this.unsupported(); }
  async stopRecording(): Promise<never> { return this.unsupported(); }
  async searchRecordings(): Promise<never> { return this.unsupported(); }
  async eraseData(): Promise<never> { return this.unsupported(); }
  async changePassword(): Promise<never> { return this.unsupported(); }
  async setControl(): Promise<never> { return this.unsupported(); }
}
export function createSession(cameraId: string, ttlMs = 5 * 60 * 1000): CctvSession { ensureNonEmpty(cameraId, 'Camera ID'); const now = Date.now(); return { id: `${SESSION_PREFIX}${now}_${cameraId}`, cameraId, state: 'connecting', startedAt: now, expiresAt: now + Math.max(ttlMs, 30_000) }; }
