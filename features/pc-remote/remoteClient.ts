import type { RemoteAction, RemoteEnvelope } from './remoteProtocol';
import { validateAction } from './remoteProtocol';

export type RemoteClientState = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';

type Listener = (state: RemoteClientState, error?: string) => void;

type ActionResult = Extract<RemoteEnvelope, { kind: 'action.result' }>;

type StateMessage = Extract<RemoteEnvelope, { kind: 'state' }>;

export class PcRemoteClient {
  private socket: WebSocket | null = null;
  private listener: Listener | null = null;
  private sequence = 0;
  private authenticated = false;
  private pending = new Map<string, (result: ActionResult) => void>();

  onState(listener: Listener): void {
    this.listener = listener;
  }

  connect(url: string, deviceId: string, token: string): void {
    this.close();
    this.authenticated = false;
    this.emit('connecting');

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.send({ kind: 'auth', deviceId, token });
    };

    socket.onmessage = (event) => {
      let message: RemoteEnvelope;
      try {
        message = JSON.parse(String(event.data)) as RemoteEnvelope;
      } catch {
        this.emit('error', 'The PC sent an invalid message.');
        return;
      }

      if (message.kind === 'state') {
        this.authenticated = message.connected === true;
        this.emit(this.authenticated ? 'connected' : 'error', this.authenticated ? undefined : 'PC authentication failed.');
        return;
      }

      if (message.kind === 'action.result') {
        this.pending.get(message.requestId)?.(message);
        this.pending.delete(message.requestId);
      }
    };

    socket.onclose = () => {
      this.authenticated = false;
      this.emit('closed');
    };

    socket.onerror = () => this.emit('error', 'Unable to connect to the PC.');
  }

  disconnect(): void {
    this.close();
  }

  sendAction(action: RemoteAction): string {
    if (!validateAction(action)) throw new Error('INVALID_REMOTE_ACTION');
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.authenticated) throw new Error('PC_NOT_AUTHENTICATED');
    const requestId = `${Date.now()}-${++this.sequence}`;
    this.send({ kind: 'action', requestId, action });
    return requestId;
  }

  private send(message: RemoteEnvelope): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(message));
  }

  private close(): void {
    this.socket?.close();
    this.socket = null;
    this.authenticated = false;
    this.pending.clear();
  }

  private emit(state: RemoteClientState, error?: string): void {
    this.listener?.(state, error);
  }
}
