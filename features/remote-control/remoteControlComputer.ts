import { PcRemoteController } from '@/features/pc-remote/pcRemoteController';
import type { RemoteConnection } from './remoteControlStore';

export const activePcRemoteController = new PcRemoteController();

export function computerConnectionToPc(connection: RemoteConnection) {
  if (connection.type !== 'computer') throw new Error('NOT_A_COMPUTER_CONNECTION');
  if (!connection.address) throw new Error('PC_ADDRESS_REQUIRED');

  return {
    deviceId: connection.id,
    displayName: connection.name,
    os: 'windows' as const,
    host: connection.address,
    port: connection.port ?? 8765,
    token: connection.pairingSecret ?? '',
    pairedAt: connection.lastSeenAt ?? Date.now(),
  };
}

export function connectComputer(connection: RemoteConnection): void {
  const pc = computerConnectionToPc(connection);
  if (!pc.token) throw new Error('PC_PAIRING_TOKEN_MISSING');
  activePcRemoteController.connect(pc);
}

export function leftClick(): void {
  activePcRemoteController.click('left');
}

export function rightClick(): void {
  activePcRemoteController.click('right');
}

export function scrollComputer(deltaX: number, deltaY: number): void {
  activePcRemoteController.scroll(deltaX, deltaY);
}

export function pressComputerKey(key: string): void {
  activePcRemoteController.key(key, true);
  activePcRemoteController.key(key, false);
}
