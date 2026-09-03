import type { Stage6VoiceBridge, VoiceInputState } from './stage6Voice';

export type LiveModePhase = 'idle' | 'ready' | 'holding' | 'processing' | 'speaking' | 'ended' | 'error';

export type LiveModeState = {
  open: boolean;
  phase: LiveModePhase;
  voiceInput: VoiceInputState;
  assistantText: string;
  error: string | null;
};

export const INITIAL_LIVE_MODE_STATE: LiveModeState = {
  open: false,
  phase: 'idle',
  voiceInput: 'idle',
  assistantText: '',
  error: null,
};

export class NexusLiveModeController {
  private state = INITIAL_LIVE_MODE_STATE;
  private readonly onState: (state: LiveModeState) => void;

  constructor(onState: (state: LiveModeState) => void) {
    this.onState = onState;
  }

  private update(patch: Partial<LiveModeState>): void {
    this.state = { ...this.state, ...patch };
    this.onState(this.state);
  }

  getState(): LiveModeState {
    return this.state;
  }

  open(): void {
    this.update({ open: true, phase: 'ready', voiceInput: 'idle', assistantText: '', error: null });
  }

  async holdStart(bridge: Stage6VoiceBridge): Promise<void> {
    try {
      this.update({ phase: 'holding', voiceInput: 'listening', error: null });
      await bridge.startListening(() => undefined);
    } catch (error) {
      this.update({ phase: 'error', voiceInput: 'idle', error: error instanceof Error ? error.message : 'VOICE_INPUT_FAILED' });
    }
  }

  async holdEnd(bridge: Stage6VoiceBridge): Promise<void> {
    try {
      await bridge.stopListening();
      this.update({ phase: 'processing', voiceInput: 'processing' });
    } catch (error) {
      this.update({ phase: 'error', voiceInput: 'idle', error: error instanceof Error ? error.message : 'VOICE_STOP_FAILED' });
    }
  }

  async stopOutput(bridge: Stage6VoiceBridge): Promise<void> {
    await bridge.stopOutput().catch(() => undefined);
    this.update({ phase: this.state.open ? 'ready' : 'ended' });
  }

  async end(bridge: Stage6VoiceBridge): Promise<void> {
    await bridge.stopListening().catch(() => undefined);
    await bridge.stopOutput().catch(() => undefined);
    this.update({ open: false, phase: 'ended', voiceInput: 'idle', assistantText: '' });
  }
}
