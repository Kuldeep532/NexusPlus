import { createRemotePairingIdentity, buildUnlockRequest } from './remoteComputerSecurity';

export interface RemoteAgentHello {
  type: 'agent_hello';
  protocol: number;
  computerId: string;
  publicKey: string;
  paired: boolean;
}

export interface RemoteUnlockResult {
  ok: boolean;
  result?: { platform: string; action: string };
}

export async function pairWithDesktopAgent(url: string): Promise<{ computerId: string; code: string }> {
  const identity = await createRemotePairingIdentity();
  const socket = await openSocket(url);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.close(); reject(new Error('Desktop agent pairing timed out.')); }, 15000);
    socket.onmessage = (event) => {
      const message = JSON.parse(String(event.data)) as RemoteAgentHello | { type: string; code?: string; message?: string };
      if (message.type === 'pair_pending' && 'code' in message && message.code) {
        clearTimeout(timeout);
        resolve({ computerId: 'pending', code: message.code });
      } else if (message.type === 'error') {
        clearTimeout(timeout);
        socket.close();
        reject(new Error(message.message ?? 'Desktop pairing failed.'));
      }
    };
    socket.send(JSON.stringify({ type: 'pair_request', publicKey: identity.publicKey }));
  });
}

export async function requestRemoteUnlock(url: string, computerId: string): Promise<RemoteUnlockResult> {
  const socket = await openSocket(url);
  return new Promise((resolve, reject) => {
    let challenge: string | undefined;
    const timeout = setTimeout(() => { socket.close(); reject(new Error('Remote unlock timed out.')); }, 30000);
    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(String(event.data));
        if (message.type === 'unlock_challenge') {
          challenge = message.challenge;
          const request = await buildUnlockRequest(computerId, crypto.randomUUID(), challenge);
          socket.send(JSON.stringify({ type: 'unlock_response', challenge, signature: request.signedChallenge, publicKey: (await createRemotePairingIdentity()).publicKey }));
          return;
        }
        if (message.type === 'unlock_result') {
          clearTimeout(timeout);
          socket.close();
          resolve({ ok: message.ok === true, result: message.result });
          return;
        }
        if (message.type === 'error') throw new Error(message.message ?? 'Remote unlock was rejected.');
      } catch (error) {
        clearTimeout(timeout);
        socket.close();
        reject(error instanceof Error ? error : new Error('Remote unlock failed.'));
      }
    };
    socket.send(JSON.stringify({ type: 'unlock_request', computerId }));
  });
}

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timeout = setTimeout(() => { socket.close(); reject(new Error('Could not connect to desktop agent.')); }, 10000);
    socket.onopen = () => { clearTimeout(timeout); resolve(socket); };
    socket.onerror = () => { clearTimeout(timeout); reject(new Error('Desktop agent connection failed.')); };
  });
}
