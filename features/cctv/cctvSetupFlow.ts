import type { CctvDeviceKind } from './cctvTypes';

export type CctvSetupStep = 'method' | 'identify' | 'credentials' | 'complete';
export type CctvSetupMethod = 'qr' | 'serial' | 'manual';

export interface CctvSetupDraft {
  step: CctvSetupStep;
  method?: CctvSetupMethod;
  deviceKind?: CctvDeviceKind;
  qrPayload?: string;
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

export function completeCctvIdentification(draft: CctvSetupDraft, input: { qrPayload?: string; serialNumber?: string }): CctvSetupDraft {
  const method = draft.method;
  const qrPayload = input.qrPayload?.trim();
  const serialNumber = input.serialNumber?.trim();
  if (method === 'qr' && !qrPayload && !serialNumber) throw new Error('Scan or upload the CCTV QR code, or enter the serial number.');
  if (method === 'serial' && !serialNumber) throw new Error('Serial number is required.');
  if (method === 'manual' && !serialNumber) throw new Error('Manual setup requires a serial number.');
  return { ...draft, qrPayload: qrPayload || undefined, serialNumber: serialNumber || undefined, step: 'credentials' };
}

export function completeCctvCredentials(draft: CctvSetupDraft, input: { name: string; username: string }): CctvSetupDraft {
  if (!draft.method || draft.step !== 'credentials') throw new Error('Complete camera identification first.');
  if (!input.name.trim()) throw new Error('Camera name is required.');
  if (!input.username.trim()) throw new Error('Username is required.');
  return { ...draft, name: input.name.trim(), username: input.username.trim(), step: 'complete' };
}
