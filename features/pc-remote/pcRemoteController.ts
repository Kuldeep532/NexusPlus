import { PcRemoteClient } from './remoteClient';
import type { PairedPc } from './remoteStore';

type ControllerListener = (connected: boolean) => void;

export class PcRemoteController {
  private readonly client = new PcRemoteClient();
  private listener: ControllerListener | null = null;

  constructor() {
    this.client.onState((state) => this.listener?.(state === 'connected'));
  }

  onConnectionChange(listener: ControllerListener): void {
    this.listener = listener;
  }

  connect(pc: PairedPc): void {
    this.client.connect(`ws://${pc.host}:${pc.port}`, pc.deviceId, pc.token);
  }

  disconnect(): void {
    this.client.disconnect();
  }

  move(x: number, y: number): string {
    return this.client.sendAction({ type: 'mouse.move', x, y });
  }

  click(button: 'left' | 'middle' | 'right' = 'left', clickCount = 1): string {
    return this.client.sendAction({ type: 'mouse.click', button, clickCount });
  }

  scroll(deltaX: number, deltaY: number): string {
    return this.client.sendAction({ type: 'mouse.scroll', deltaX, deltaY });
  }

  key(key: string, pressed: boolean): string {
    return this.client.sendAction({ type: 'keyboard.key', key, pressed });
  }

  text(text: string): string {
    return this.client.sendAction({ type: 'keyboard.text', text });
  }

  openShell(command: string): string {
    return this.client.sendAction({ type: 'shell.open', command });
  }

  lock(): string {
    return this.client.sendAction({ type: 'system.lock' });
  }

  shutdown(delaySeconds = 30): string {
    return this.client.sendAction({ type: 'system.shutdown', delaySeconds });
  }
}
