import type { RemoteAction, RemoteEnvelope } from './remoteProtocol';
import { validateAction } from './remoteProtocol';

export type RemoteClientState = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';

type Listener = (state: RemoteClientState, error?: string) => void;

export class PcRemoteClient {
  private socket: WebSocket | null = null;
  private listener: Listener | null = null;
  private sequence = 0;

  onState(listener: Listener): void {
    this.listener = listener;
  }

  connect(url: string, deviceId: string, token: string): void {
    this.close();
    this.emit('connecting');
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.onopen = () => {
      this.send({ kind: 'auth', deviceId, token });
      this.emit('connected');
    };
    socket.onclose = () => this.emit('closed');
    socket.onerror = () => this.emit('error', 'Unable to connect to the PC.');
  }

  disconnect(): void {
    this.close();
  }

  sendAction(action: RemoteAction): string {
    if (!validateAction(action)) throw new Error('INVALID_REMOTE_ACTION');
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) throw new Error('PC_NOT_CONNECTED');
    const requestId = `${Date.now()}-${++this.sequence}`;
    this.send({ kind: 'action', requestId, action });
    return requestId;
  }

  private send(message: RemoteEnvelope): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(message));
  }

  private close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private emit(state: RemoteClientState, error?: string): void {
    this.listener?.(state, error);
  }
}
