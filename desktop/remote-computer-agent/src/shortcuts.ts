export interface Shortcut { key: string; modifiers: string[]; label: string; action: string; }

export const SHORTCUTS: Shortcut[] = [
  { key: 'Space', modifiers: ['CTRL'], label: 'Mute or unmute microphone', action: 'meeting.toggle-mute' },
  { key: 'V', modifiers: ['CTRL', 'SHIFT'], label: 'Toggle meeting video', action: 'meeting.toggle-video' },
  { key: 'F6', modifiers: [], label: 'Move focus to agent status', action: 'agent.focus-status' },
  { key: 'F8', modifiers: [], label: 'Toggle voice input', action: 'agent.toggle-voice' },
  { key: 'F10', modifiers: ['CTRL'], label: 'Lock computer', action: 'system.lock' },
];

export function getShortcutHelp(): string {
  return SHORTCUTS.map(s => `${s.modifiers.join('+')}${s.modifiers.length ? '+' : ''}${s.key}: ${s.label}`).join('\n');
}
