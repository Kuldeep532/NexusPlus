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
