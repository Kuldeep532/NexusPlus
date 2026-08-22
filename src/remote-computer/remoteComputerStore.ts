import type { RemoteComputer } from './remoteComputerTypes';

const computers = new Map<string, RemoteComputer>();

export function upsertRemoteComputer(computer: RemoteComputer): void {
  computers.set(computer.id, computer);
}

export function getRemoteComputer(computerId: string): RemoteComputer | undefined {
  return computers.get(computerId);
}

export function listRemoteComputers(): RemoteComputer[] {
  return Array.from(computers.values());
}

export function removeRemoteComputer(computerId: string): void {
  computers.delete(computerId);
}
