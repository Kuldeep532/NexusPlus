import type { CctvDeviceKind } from './cctvTypes';

export type CctvSetupStep = 'method' | 'identify' | 'credentials' | 'complete';
export type CctvSetupMethod = 'qr' | 'intent';

export interface CctvSetupDraft {
  step: CctvSetupStep;
  method?: CctvSetupMethod;
  deviceKind?: CctvDeviceKind;
  qrPayload?: string;
  intentToken?: string;
  serialNumber?: string;
  name?: string;
  username?: string;
}

export function initialCctvSetupDraft(): CctvSetupDraft {
  return { step: 'method' };
}

export function selectCctvSetupMethod(draft: CctvSetupDraft, method: CctvSetupMethod): CctvSetupDraft {
  return { ...draft, method, step: 'identify' };
}

export function completeCctvIdentification(
  draft: CctvSetupDraft,
  input: { qrPayload?: string; intentToken?: string; serialNumber?: string },
): CctvSetupDraft {
  const method = draft.method;
  const qrPayload = input.qrPayload?.trim();
  const intentToken = input.intentToken?.trim();
  const serialNumber = input.serialNumber?.trim();
  if (method === 'qr' && !qrPayload) throw new Error('Authorized CCTV QR identification is required.');
  if (method === 'intent' && !intentToken) throw new Error('Authorized CCTV intent is required.');
  return {
    ...draft,
    qrPayload: qrPayload || undefined,
    intentToken: intentToken || undefined,
    serialNumber: serialNumber || undefined,
    step: 'credentials',
  };
}

export function completeCctvCredentials(draft: CctvSetupDraft, input: { name: string; username: string }): CctvSetupDraft {
  if ((!draft.qrPayload && !draft.intentToken) || draft.step !== 'credentials') throw new Error('Complete authorized camera identification first.');
  if (!input.name.trim()) throw new Error('Camera name is required.');
  if (!input.username.trim()) throw new Error('Username is required.');
  return { ...draft, name: input.name.trim(), username: input.username.trim(), step: 'complete' };
}
