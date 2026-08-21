export type SelfieGuidance =
  | 'LOOK_AT_CAMERA'
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'MOVE_CLOSER'
  | 'MOVE_BACK'
  | 'HOLD_STILL'
  | 'TAKING_SELFIE'
  | 'PHOTO_SAVED';

export type SelfieFaceMetrics = {
  bounds: { x: number; y: number; width: number; height: number };
  roll: number;
  yaw: number;
  pitch: number;
  smilingProbability?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
};
