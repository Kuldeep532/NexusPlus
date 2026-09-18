import { NativeModules } from 'react-native';
import type { MirrorMediaItem, MirrorMode, MirrorTarget } from './screenMirrorTypes';

type NativeMirror = {
  getStatus?: () => Promise<Record<string, unknown>>;
  requestScreenCapture?: (mode: 'complete-screen' | 'specific-app') => Promise<boolean>;
  stopProjection?: () => Promise<boolean>;
  castMedia?: (target: MirrorTarget, uri: string, mimeType: string | null, kind: string, name: string | null, durationMs: number | null) => Promise<boolean>;
  replaceCastMedia?: (uri: string, mimeType: string | null, kind: string, name: string | null, durationMs: number | null) => Promise<boolean>;
  stopMedia?: () => Promise<boolean>;
};

const native = NativeModules.NexusScreenMirror as NativeMirror | undefined;

export async function getMirrorStatus() {
  if (!native?.getStatus) return { available: false, projectionActive: false, mediaActive: false };
  try {
    return await native.getStatus();
  } catch {
    return { available: false, projectionActive: false, mediaActive: false };
  }
}

export async function requestScreenCapture(mode: Extract<MirrorMode, 'complete-screen' | 'specific-app'>) {
  if (!native?.requestScreenCapture) throw new Error('SCREEN_MIRROR_NATIVE_UNAVAILABLE');
  return native.requestScreenCapture(mode);
}

export async function stopScreenProjection() {
  if (!native?.stopProjection) return false;
  return native.stopProjection();
}

export async function castMedia(target: MirrorTarget, item: MirrorMediaItem) {
  if (!native?.castMedia) throw new Error('MEDIA_CAST_NATIVE_UNAVAILABLE');
  return native.castMedia(target, item.uri, item.mimeType ?? null, item.kind, item.name ?? null, item.durationMs ?? null);
}

export async function replaceCastMedia(item: MirrorMediaItem) {
  if (!native?.replaceCastMedia) throw new Error('MEDIA_CAST_NATIVE_UNAVAILABLE');
  return native.replaceCastMedia(item.uri, item.mimeType ?? null, item.kind, item.name ?? null, item.durationMs ?? null);
}

export async function stopCastMedia() {
  if (!native?.stopMedia) return false;
  return native.stopMedia();
}
