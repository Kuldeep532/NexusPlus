export type DeviceTrustLevel = 'trusted' | 'restricted' | 'blocked';

export interface DeviceIntegrityVerdict {
  appRecognized: boolean;
  playLicensed: boolean;
  meetsDeviceIntegrity: boolean;
  meetsStrongIntegrity: boolean;
  playProtectOn: boolean;
  screenCaptureRisk: boolean;
  controlRisk: boolean;
}

export interface DeviceSecurityState {
  trust: DeviceTrustLevel;
  userMessage?: string;
  reason?: string;
}

export const BLOCKED_DEVICE_MESSAGE =
  'Please uninstall this app to use this app.';

export function evaluateDeviceIntegrity(verdict: DeviceIntegrityVerdict): DeviceSecurityState {
  if (!verdict.appRecognized || !verdict.playLicensed) {
    return {
      trust: 'blocked',
      userMessage: BLOCKED_DEVICE_MESSAGE,
      reason: 'unrecognized-or-unlicensed-install',
    };
  }

  if (!verdict.meetsDeviceIntegrity || !verdict.playProtectOn) {
    return {
      trust: 'blocked',
      userMessage: BLOCKED_DEVICE_MESSAGE,
      reason: 'device-integrity-failed',
    };
  }

  if (verdict.screenCaptureRisk || verdict.controlRisk) {
    return {
      trust: 'restricted',
      reason: 'app-access-risk-detected',
    };
  }

  return { trust: 'trusted' };
}
