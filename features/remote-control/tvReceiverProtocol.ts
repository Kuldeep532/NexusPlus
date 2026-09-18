export type TvReceiverCommand =
  | { type: 'key'; key: string }
  | { type: 'scroll'; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'launchApp'; appId: string; packageHints?: string[] }
  | { type: 'requestApps' }
  | { type: 'requestAccessibilityState' };

export type TvReceiverEvent =
  | { type: 'ready'; deviceName: string; brand?: string }
  | { type: 'cursor'; label: string }
  | { type: 'apps'; apps: Array<{ id: string; name: string; packageName?: string }> }
  | { type: 'error'; code: string; message: string };

export const TV_RECEIVER_PROTOCOL = 1;
