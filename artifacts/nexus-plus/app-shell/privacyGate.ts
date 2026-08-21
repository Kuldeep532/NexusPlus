export const PRIVACY_POLICY_VERSION = '1.0';

export type PrivacyGateState = {
  accepted: boolean;
  acceptedVersion?: string;
  acceptedAt?: number;
};

export const DEFAULT_PRIVACY_GATE_STATE: PrivacyGateState = {
  accepted: false,
};

export function canEnterApp(state: PrivacyGateState): boolean {
  return state.accepted && state.acceptedVersion === PRIVACY_POLICY_VERSION;
}

export function acceptPrivacyPolicy(): PrivacyGateState {
  return {
    accepted: true,
    acceptedVersion: PRIVACY_POLICY_VERSION,
    acceptedAt: Date.now(),
  };
}

export function invalidatePrivacyAcceptance(): PrivacyGateState {
  return DEFAULT_PRIVACY_GATE_STATE;
}
