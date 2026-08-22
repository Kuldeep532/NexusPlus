import { createPairingNonce, createRemotePairingIdentity, buildUnlockRequest } from './remoteComputerSecurity';
import type { RemoteComputerCommandRequest, RemoteComputerCommandResult } from './remoteComputerTypes';

export interface RemoteAgentHello {
  type: 'agent_hello'; protocol: number; computerId: string; publicKey: string; paired: boolean;
  screenReader?: 'nvda' | 'orca' | 'voiceover' | 'none' | 'unknown'; capabilities?: string[];
}
export interface RemoteUnlockResult { ok: boolean; result?: { platform: string; action: string } }

export async function pairWithDesktopAgent(url: string): Promise<{ computerId: string; code: string; publicKey: string }> {
  const identity = await createRemotePairingIdentity(); const socket = await openSocket(url);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.close(); reject(new Error('Desktop agent pairing timed out.')); }, 15000);
    socket.onmessage = (event) => {
      const message = JSON.parse(String(event.data));
      if (message.type === 'pair_pending' && message.code) { clearTimeout(timeout); socket.close(); resolve({ computerId: message.computerId ?? 'pending', code: message.code, publicKey: identity.publicKey }); }
      else if (message.type === 'error') { clearTimeout(timeout); socket.close(); reject(new Error(message.message ?? 'Desktop pairing failed.')); }
    };
    socket.send(JSON.stringify({ type: 'pair_request', publicKey: identity.publicKey }));
  });
}

export async function confirmDesktopPairing(url: string, code: string, publicKey: string): Promise<void> {
  const socket = await openSocket(url);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.close(); reject(new Error('Desktop pairing confirmation timed out.')); }, 15000);
    socket.onmessage = (event) => { const message = JSON.parse(String(event.data));
      if (message.type === 'pair_success') { clearTimeout(timeout); socket.close(); resolve(); }
      else if (message.type === 'error') { clearTimeout(timeout); socket.close(); reject(new Error(message.message ?? 'Desktop pairing confirmation failed.')); }
    };
    socket.send(JSON.stringify({ type: 'pair_confirm', code, publicKey }));
  });
}

export async function requestRemoteUnlock(url: string, computerId: string): Promise<RemoteUnlockResult> {
  const socket = await openSocket(url); const identity = await createRemotePairingIdentity();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.close(); reject(new Error('Remote unlock timed out.')); }, 30000);
    socket.onmessage = async (event) => { try { const message = JSON.parse(String(event.data));
      if (message.type === 'unlock_challenge') { const challengeId = await createPairingNonce(); const request = await buildUnlockRequest(computerId, challengeId, message.challenge); socket.send(JSON.stringify({ type: 'unlock_response', challenge: message.challenge, signature: request.signedChallenge, publicKey: identity.publicKey })); return; }
      if (message.type === 'unlock_result') { clearTimeout(timeout); socket.close(); resolve({ ok: message.ok === true, result: message.result }); return; }
      if (message.type === 'error') throw new Error(message.message ?? 'Remote unlock was rejected.');
    } catch (error) { clearTimeout(timeout); socket.close(); reject(error instanceof Error ? error : new Error('Remote unlock failed.')); } };
    socket.send(JSON.stringify({ type: 'unlock_request', computerId }));
  });
}

/** Stage 3: allowlisted remote control. Each command gets a fresh desktop challenge and phone biometric signature. */
export async function sendRemoteCommand(url: string, request: Omit<RemoteComputerCommandRequest, 'commandId'>): Promise<RemoteComputerCommandResult> {
  const socket = await openSocket(url); const identity = await createRemotePairingIdentity(); const commandId = await createPairingNonce();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.close(); reject(new Error('Remote command timed out.')); }, 20000);
    socket.onmessage = async (event) => { try { const message = JSON.parse(String(event.data));
      if (message.type === 'command_challenge') {
        const signed = await buildUnlockRequest(request.computerId, commandId, message.challenge);
        socket.send(JSON.stringify({ type: 'command_response', request: { ...request, commandId }, challenge: message.challenge, signature: signed.signedChallenge, publicKey: identity.publicKey }));
        return;
      }
      if (message.type === 'command_result') { clearTimeout(timeout); socket.close(); resolve(message.result as RemoteComputerCommandResult); return; }
      if (message.type === 'error') throw new Error(message.message ?? 'Remote command rejected.');
    } catch (error) { clearTimeout(timeout); socket.close(); reject(error instanceof Error ? error : new Error('Remote command failed.')); } };
    socket.send(JSON.stringify({ type: 'command_request', computerId: request.computerId, source: request.source, transcript: request.transcript, commandId }));
  });
}

function openSocket(url: string): Promise<WebSocket> { return new Promise((resolve, reject) => { const socket = new WebSocket(url); const timeout = setTimeout(() => { socket.close(); reject(new Error('Could not connect to desktop agent.')); }, 10000); socket.onopen = () => { clearTimeout(timeout); resolve(socket); }; socket.onerror = () => { clearTimeout(timeout); reject(new Error('Desktop agent connection failed.')); }; }); }
