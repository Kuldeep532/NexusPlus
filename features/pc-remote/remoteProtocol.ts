export type PcOs = 'windows' | 'ubuntu';

export type RemoteAction =
  | { type: 'mouse.move'; x: number; y: number }
  | { type: 'mouse.click'; button: 'left' | 'middle' | 'right'; clickCount?: number }
  | { type: 'mouse.scroll'; deltaX: number; deltaY: number }
  | { type: 'keyboard.key'; key: string; pressed: boolean }
  | { type: 'keyboard.text'; text: string }
  | { type: 'shell.open'; command: string }
  | { type: 'system.lock' }
  | { type: 'system.shutdown'; delaySeconds?: number };

export type RemoteEnvelope =
  | { kind: 'hello'; protocol: 1; clientId: string; appVersion: string }
  | { kind: 'pair.request'; requestId: string; displayName: string; pairingCode: string }
  | { kind: 'pair.accept'; requestId: string; deviceId: string; os: PcOs; displayName: string }
  | { kind: 'auth'; deviceId: string; token: string }
  | { kind: 'action'; requestId: string; action: RemoteAction }
  | { kind: 'action.result'; requestId: string; ok: boolean; error?: string }
  | { kind: 'state'; requestId: string; connected: boolean; os?: PcOs; displayName?: string }
  | { kind: 'ping'; requestId: string; timestamp: number }
  | { kind: 'pong'; requestId: string; timestamp: number };

export function isSupportedOs(value: unknown): value is PcOs {
  return value === 'windows' || value === 'ubuntu';
}

export function validateAction(action: RemoteAction): boolean {
  switch (action.type) {
    case 'mouse.move':
      return Number.isFinite(action.x) && Number.isFinite(action.y);
    case 'mouse.click':
      return ['left', 'middle', 'right'].includes(action.button);
    case 'mouse.scroll':
      return Number.isFinite(action.deltaX) && Number.isFinite(action.deltaY);
    case 'keyboard.key':
      return action.key.length > 0 && action.key.length <= 64;
    case 'keyboard.text':
      return action.text.length <= 4096;
    case 'shell.open':
      return action.command.length > 0 && action.command.length <= 512;
    case 'system.lock':
      return true;
    case 'system.shutdown':
      return action.delaySeconds === undefined || (action.delaySeconds >= 0 && action.delaySeconds <= 3600);
  }
}
