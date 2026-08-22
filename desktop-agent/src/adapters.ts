import { execFile } from 'node:child_process';
import type { AgentCapabilities, RemoteCommand } from './types';

const safeKeys = new Set(['ENTER','ESC','TAB','SPACE','BACKSPACE','ARROWUP','ARROWDOWN','ARROWLEFT','ARROWRIGHT','HOME','END','PAGEUP','PAGEDOWN','DELETE','INSERT','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12']);

export interface AdapterResult { ok: boolean; output?: string; error?: string; }
export interface PlatformAdapter {
  execute(command: RemoteCommand): Promise<AdapterResult>;
  receiveVoiceTranscript(transcript: string): Promise<AdapterResult>;
  capabilities: AgentCapabilities;
}

function run(program: string, args: string[]): Promise<AdapterResult> {
  return new Promise(resolve => execFile(program, args, { timeout: 5000 }, (error, stdout) => error ? resolve({ ok: false, error: 'policy-denied' }) : resolve({ ok: true, output: stdout.trim() })));
}

export function createAdapter(capabilities: AgentCapabilities): PlatformAdapter {
  return {
    capabilities,
    async execute(command) {
      if (command.type === 'keyboard') {
        const key = command.key.toUpperCase();
        if (key.length !== 1 && !safeKeys.has(key)) return { ok: false, error: 'invalid-command' };
        return { ok: false, error: 'native-input-helper-required' };
      }
      if (command.type === 'pointer') return { ok: false, error: 'native-input-helper-required' };
      if (command.type === 'clipboard') return { ok: false, error: 'native-clipboard-helper-required' };
      if (command.type === 'screen-reader') return { ok: false, error: 'native-screen-reader-helper-required' };
      if (command.type === 'system' && command.action === 'lock') {
        if (capabilities.platform === 'windows') return run('rundll32.exe', ['user32.dll,LockWorkStation']);
        if (capabilities.platform === 'macos') return run('/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession', ['-suspend']);
        return run('loginctl', ['lock-session']);
      }
      return { ok: false, error: 'unsupported' };
    },
    async receiveVoiceTranscript(transcript) {
      const normalized = transcript.trim().toLowerCase();
      if (!normalized) return { ok: false, error: 'invalid-command' };
      if (normalized === 'lock computer' || normalized === 'lock the computer') return this.execute({ type: 'system', action: 'lock' });
      return { ok: false, error: 'voice-command-not-mapped' };
    },
  };
}
