export type DynamicIntent =
  | 'meeting.mute' | 'meeting.unmute' | 'meeting.video.on' | 'meeting.video.off'
  | 'messaging.send' | 'media.play.search' | 'media.play_pause' | 'media.next' | 'media.previous'
  | 'system.lock' | 'system.volume.up' | 'system.volume.down' | 'system.volume.mute' | 'system.open'
  | 'keyboard.shortcut' | 'unknown';

export interface DynamicCommand {
  intent: DynamicIntent;
  raw: string;
  target?: string;
  query?: string;
  payload?: string;
  key?: string;
  modifiers?: string[];
  confidence: number;
  requiresConfirmation: boolean;
}

const normalize = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();
const result = (intent: DynamicIntent, raw: string, extra: Partial<DynamicCommand> = {}): DynamicCommand => ({ intent, raw, confidence: 0.98, requiresConfirmation: false, ...extra });

/** Finite, auditable voice intent mapping. Speech is never converted to arbitrary shell commands. */
export function parseDynamicCommand(transcript: string): DynamicCommand {
  const raw = transcript.trim();
  const t = normalize(raw);
  if (!t) return result('unknown', raw, { confidence: 0, requiresConfirmation: true });
  if (/^(unmute|unmute me|turn (the )?microphone on|turn on (the )?mic)$/.test(t)) return result('meeting.unmute', raw);
  if (/^(mute|mute me|turn (the )?microphone off|turn off (the )?mic)$/.test(t)) return result('meeting.mute', raw);
  if (/^(turn on (the )?video|start (the )?camera|camera on)$/.test(t)) return result('meeting.video.on', raw);
  if (/^(turn off (the )?video|stop (the )?camera|camera off)$/.test(t)) return result('meeting.video.off', raw);

  const message = t.match(/^(?:whatsapp\s+)?send(?: a)? message(?: to)?\s+(.+?)\s*(?:saying|that says)\s+(.+)$/i);
  if (message) return result('messaging.send', raw, { target: message[1], payload: message[2], requiresConfirmation: true });
  const play = t.match(/^play\s+(.+?)(?:\s+video)?$/i);
  if (play && !/^(pause|next|previous|prev|music)$/.test(play[1])) return result('media.play.search', raw, { query: play[1] });
  if (/^(play|pause|play pause|resume|pause playback)$/.test(t)) return result('media.play_pause', raw);
  if (/^(next|next track|next song|skip|skip track)$/.test(t)) return result('media.next', raw);
  if (/^(previous|previous track|previous song|go back|last track)$/.test(t)) return result('media.previous', raw);

  if (/^(lock|lock computer|lock the computer|secure the computer)$/.test(t)) return result('system.lock', raw);
  if (/^(volume up|increase volume|turn volume up|make it louder)$/.test(t)) return result('system.volume.up', raw);
  if (/^(volume down|decrease volume|turn volume down|make it quieter)$/.test(t)) return result('system.volume.down', raw);
  if (/^(mute volume|mute sound|mute computer|silence computer)$/.test(t)) return result('system.volume.mute', raw);

  const open = t.match(/^(?:open|launch|start)\s+(browser|chrome|firefox|edge|terminal|file manager|files)$/i);
  if (open) return result('system.open', raw, { target: open[1] });
  const shortcut = t.match(/^(?:press|hit)\s+(ctrl|control|alt|shift|win|windows|command|cmd)\s*\+\s*([a-z0-9]+)$/i);
  if (shortcut) {
    const modifier = shortcut[1].replace('control', 'CTRL').replace('windows', 'WIN').replace('command', 'CMD').replace('cmd', 'CMD').toUpperCase();
    return result('keyboard.shortcut', raw, { modifiers: [modifier], key: shortcut[2].toUpperCase() });
  }
  const simpleKey = t.match(/^(?:press|hit)\s+(enter|escape|esc|tab|space|backspace|delete|up|down|left|right|home|end)$/i);
  if (simpleKey) {
    const keyMap: Record<string, string> = { esc: 'ESC', escape: 'ESC', enter: 'ENTER', tab: 'TAB', space: 'SPACE', backspace: 'BACKSPACE', delete: 'DELETE', up: 'ARROWUP', down: 'ARROWDOWN', left: 'ARROWLEFT', right: 'ARROWRIGHT', home: 'HOME', end: 'END' };
    return result('keyboard.shortcut', raw, { key: keyMap[simpleKey[1].toLowerCase()] });
  }
  return result('unknown', raw, { confidence: 0.05, requiresConfirmation: true });
}
