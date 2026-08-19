import type { SelfieFaceMetrics, SelfieGuidance } from './SelfieTypes';

export const SELFIE_MESSAGES: Record<SelfieGuidance, string> = {
  LOOK_AT_CAMERA: 'Look at the camera',
  MOVE_LEFT: 'Move left',
  MOVE_RIGHT: 'Move right',
  MOVE_UP: 'Move up',
  MOVE_DOWN: 'Move down',
  MOVE_CLOSER: 'Move closer',
  MOVE_BACK: 'Move back',
  HOLD_STILL: 'Hold still',
  TAKING_SELFIE: 'Taking selfie',
  PHOTO_SAVED: 'Selfie saved',
};

const CENTER_TOLERANCE = 0.12;
const IDEAL_FACE_MIN = 0.34;
const IDEAL_FACE_MAX = 0.72;
const MAX_YAW = 12;
const MAX_PITCH = 12;
const MAX_ROLL = 10;

export function evaluateFace(metrics: SelfieFaceMetrics | null, frameWidth: number, frameHeight: number): { guidance: SelfieGuidance; ready: boolean } {
  if (!metrics) return { guidance: 'LOOK_AT_CAMERA', ready: false };

  const centerX = (metrics.bounds.x + metrics.bounds.width / 2) / frameWidth;
  const centerY = (metrics.bounds.y + metrics.bounds.height / 2) / frameHeight;
  const faceRatio = metrics.bounds.width / frameWidth;

  if (centerX < 0.5 - CENTER_TOLERANCE) return { guidance: 'MOVE_RIGHT', ready: false };
  if (centerX > 0.5 + CENTER_TOLERANCE) return { guidance: 'MOVE_LEFT', ready: false };
  if (centerY < 0.5 - CENTER_TOLERANCE) return { guidance: 'MOVE_DOWN', ready: false };
  if (centerY > 0.5 + CENTER_TOLERANCE) return { guidance: 'MOVE_UP', ready: false };
  if (faceRatio < IDEAL_FACE_MIN) return { guidance: 'MOVE_CLOSER', ready: false };
  if (faceRatio > IDEAL_FACE_MAX) return { guidance: 'MOVE_BACK', ready: false };
  if (Math.abs(metrics.yaw) > MAX_YAW) return { guidance: metrics.yaw < 0 ? 'MOVE_RIGHT' : 'MOVE_LEFT', ready: false };
  if (Math.abs(metrics.pitch) > MAX_PITCH) return { guidance: metrics.pitch < 0 ? 'MOVE_DOWN' : 'MOVE_UP', ready: false };
  if (Math.abs(metrics.roll) > MAX_ROLL) return { guidance: 'HOLD_STILL', ready: false };

  return { guidance: 'HOLD_STILL', ready: true };
}
