const { execFile, spawn } = require('node:child_process');
const os = require('node:os');

function run(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: options.timeout ?? 5000, windowsHide: true, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(String(stderr || error.message).trim()));
      resolve(String(stdout).trim());
    });
  });
}
function runInput(command, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true }); let stdout = ''; let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; }); child.stderr.on('data', chunk => { stderr += chunk; }); child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr.trim() || `Process exited with ${code}`))); child.stdin.end(input);
  });
}
async function requestOsUnlock() {
  const platform = os.platform();
  if (platform === 'win32') throw new Error('Windows pre-login unlock requires the installed Nexus Credential Provider/helper.');
  if (platform === 'darwin') throw new Error('macOS login unlock requires the installed Nexus authorization helper.');
  if (platform === 'linux') { await run('loginctl', ['unlock-sessions']); return { platform, action: 'unlock-sessions' }; }
  throw new Error(`Unsupported desktop platform: ${platform}`);
}
function getScreenReaderInfo() {
  const platform = os.platform();
  if (platform === 'win32') return { kind: 'nvda', available: true, integration: 'NVDA controller/helper boundary' };
  if (platform === 'darwin') return { kind: 'voiceover', available: true, integration: 'VoiceOver accessibility helper boundary' };
  if (platform === 'linux') return { kind: 'orca', available: true, integration: 'AT-SPI/Orca helper boundary' };
  return { kind: 'unknown', available: false, integration: 'none' };
}
function validKey(key) { return typeof key === 'string' && /^[A-Za-z0-9_+\-\.]+$/.test(key) && key.length <= 40; }
function validModifiers(modifiers) { return Array.isArray(modifiers) && modifiers.length <= 4 && modifiers.every((m) => /^(CTRL|ALT|SHIFT|META|WIN|CMD|COMMAND|CONTROL)$/i.test(m)); }
function validPointer(command) { return ['move', 'click', 'double-click'].includes(command.action) && (command.action !== 'move' || (Number.isFinite(command.x) && Number.isFinite(command.y))) && (!command.button || ['left', 'right', 'middle'].includes(command.button)); }

async function executeKeyboard(command) {
  if (!validKey(command.key) || (command.modifiers !== undefined && !validModifiers(command.modifiers))) return { ok: false, error: 'invalid-command' };
  const key = String(command.key).toUpperCase(); const modifiers = (command.modifiers || []).map(x => String(x).toUpperCase()); const parts = [...modifiers, key];
  if (os.platform() === 'linux') await run('xdotool', ['key', parts.join('+')]);
  else if (os.platform() === 'darwin') await run('osascript', ['-e', `tell application "System Events" to keystroke "${key.replace(/"/g, '\\"')}"`]);
  else {
    const sendKey = key.length === 1 ? key : ({ ENTER: '{ENTER}', ESC: '{ESC}', TAB: '{TAB}', SPACE: ' ', BACKSPACE: '{BACKSPACE}', DELETE: '{DELETE}', ARROWUP: '{UP}', ARROWDOWN: '{DOWN}', ARROWLEFT: '{LEFT}', ARROWRIGHT: '{RIGHT}', HOME: '{HOME}', END: '{END}', PAGEUP: '{PGUP}', PAGEDOWN: '{PGDN}' }[key] || key);
    await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `$ws=New-Object -ComObject WScript.Shell; $ws.SendKeys('${sendKey.replace(/'/g, "''")}')`]);
  }
  return { ok: true, output: `Pressed ${parts.join('+')}` };
}
async function executePointer(command) {
  if (!validPointer(command)) return { ok: false, error: 'invalid-command' };
  const x = Math.round(command.x ?? 0); const y = Math.round(command.y ?? 0); const button = command.button || 'left';
  if (os.platform() === 'linux') {
    if (command.action === 'move') await run('xdotool', ['mousemove', String(x), String(y)]); else await run('xdotool', ['mousemove', String(x), String(y), 'click', button === 'right' ? '3' : button === 'middle' ? '2' : '1']);
  } else if (os.platform() === 'win32') {
    const flag = button === 'right' ? ['0x0008', '0x0010'] : button === 'middle' ? ['0x0020', '0x0040'] : ['0x0002', '0x0004'];
    const clicks = command.action === 'double-click' ? 2 : 1;
    const script = `Add-Type @'\nusing System; using System.Runtime.InteropServices; public static class M { [DllImport("user32.dll")] public static extern bool SetCursorPos(int X,int Y); [DllImport("user32.dll")] public static extern void mouse_event(uint f,uint x,uint y,uint d,UIntPtr e); }\n'@; [M]::SetCursorPos(${x},${y}); ${command.action === 'move' ? '' : `1..${clicks} | % { [M]::mouse_event(${flag[0]},0,0,0,[UIntPtr]::Zero); [M]::mouse_event(${flag[1]},0,0,0,[UIntPtr]::Zero) }`}`;
    await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script]);
  } else await run('cliclick', [command.action === 'move' ? `m:${x},${y}` : command.action === 'double-click' ? `dd:${x},${y}` : `${button === 'right' ? 'rc' : button === 'middle' ? 'mc' : 'c'}:${x},${y}`]);
  return { ok: true, output: `${command.action} at ${x}, ${y}` };
}
async function mediaKey(key) {
  if (os.platform() === 'linux') await run('xdotool', ['key', key]);
  else if (os.platform() === 'darwin') {
    const code = { PLAY: 16, NEXT: 17, PREVIOUS: 18 }[key]; await run('osascript', ['-e', `tell application "System Events" to key code ${code}`]);
  } else {
    const vk = { PLAY: '0xB3', NEXT: '0xB0', PREVIOUS: '0xB1' }[key];
    await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Add-Type '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk,byte bScan,uint dwFlags,UIntPtr dwExtraInfo);' -Name K -Namespace N; [N.K]::keybd_event(${vk},0,0,[UIntPtr]::Zero); [N.K]::keybd_event(${vk},0,2,[UIntPtr]::Zero)`]);
  }
  return { ok: true, output: `${key.toLowerCase()} media action.` };
}
async function adjustVolume(action) {
  if (os.platform() === 'linux') await run('pactl', action === 'mute' ? ['set-sink-mute', '@DEFAULT_SINK@', 'toggle'] : ['set-sink-volume', '@DEFAULT_SINK@', action === 'up' ? '+5%' : '-5%']);
  else if (os.platform() === 'darwin') {
    if (action === 'mute') await run('osascript', ['-e', 'set volume output muted not (output muted)']);
    else await run('osascript', ['-e', `set volume output volume ((output volume of (get volume settings)) ${action === 'up' ? '+' : '-'} 5)`]);
  } else {
    const key = action === 'mute' ? '0xAD' : action === 'up' ? '0xAF' : '0xAE';
    await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Add-Type '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk,byte bScan,uint dwFlags,UIntPtr dwExtraInfo);' -Name V -Namespace N; [N.V]::keybd_event(${key},0,0,[UIntPtr]::Zero); [N.V]::keybd_event(${key},0,2,[UIntPtr]::Zero)`]);
  }
  return { ok: true, output: `Volume ${action}.` };
}
async function openAllowed(target) {
  const map = {
    browser: { linux: ['xdg-open', ['https://www.google.com']], darwin: ['open', ['https://www.google.com']], win32: ['cmd.exe', ['/c', 'start', '', 'https://www.google.com']] },
    chrome: { linux: ['google-chrome', []], darwin: ['open', ['-a', 'Google Chrome']], win32: ['cmd.exe', ['/c', 'start', '', 'chrome']] },
    firefox: { linux: ['firefox', []], darwin: ['open', ['-a', 'Firefox']], win32: ['cmd.exe', ['/c', 'start', '', 'firefox']] },
    edge: { linux: ['microsoft-edge', []], darwin: ['open', ['-a', 'Microsoft Edge']], win32: ['cmd.exe', ['/c', 'start', '', 'msedge']] },
    terminal: { linux: ['x-terminal-emulator', []], darwin: ['open', ['-a', 'Terminal']], win32: ['cmd.exe', ['/c', 'start', '', 'cmd']] },
    'file manager': { linux: ['xdg-open', ['.']], darwin: ['open', ['.']], win32: ['explorer.exe', ['.']] },
    files: { linux: ['xdg-open', ['.']], darwin: ['open', ['.']], win32: ['explorer.exe', ['.']] },
  };
  const entry = map[target]; if (!entry) return { ok: false, error: 'unsupported-target' }; const [command, args] = entry[os.platform()] || [];
  await run(command, args); return { ok: true, output: `Opened ${target}.` };
}
async function executeRemoteCommand(command) {
  if (!command || typeof command !== 'object' || typeof command.type !== 'string') return { ok: false, error: 'invalid-command' };
  try {
    if (command.type === 'keyboard' && command.action === 'press') return executeKeyboard(command);
    if (command.type === 'pointer') return executePointer(command);
    if (command.type === 'clipboard') {
      if (command.action === 'read') return { ok: true, output: await run(os.platform() === 'darwin' ? 'pbpaste' : os.platform() === 'linux' ? 'xclip' : 'powershell.exe', os.platform() === 'linux' ? ['-selection', 'clipboard', '-o'] : os.platform() === 'win32' ? ['-NoProfile', '-NonInteractive', '-Command', 'Get-Clipboard'] : []) };
      if (command.action === 'write' && typeof command.text === 'string' && command.text.length <= 100000) { if (os.platform() === 'darwin') await runInput('pbcopy', [], command.text); else if (os.platform() === 'linux') await runInput('xclip', ['-selection', 'clipboard'], command.text); else await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Set-Clipboard -Value '${command.text.replace(/'/g, "''")}'`]); return { ok: true, output: 'Clipboard updated.' }; }
      return { ok: false, error: 'invalid-command' };
    }
    if (command.type === 'screen-reader') return { ok: false, error: 'native-screen-reader-helper-required' };
    if (command.type === 'system' && command.action === 'lock') { if (os.platform() === 'linux') await run('loginctl', ['lock-sessions']); else if (os.platform() === 'darwin') await run('/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession', ['-suspend']); else await run('rundll32.exe', ['user32.dll,LockWorkStation']); return { ok: true, output: 'Computer locked.' }; }
    if (command.type === 'system' && command.action === 'sleep') return { ok: false, error: 'policy-denied' };
    if (command.type === 'system' && command.action === 'media') return mediaKey(command.key);
    if (command.type === 'system' && command.action === 'volume') return adjustVolume(command.key);
    if (command.type === 'system' && command.action === 'open') return openAllowed(command.target);
    return { ok: false, error: 'unsupported' };
  } catch (error) { return { ok: false, error: 'execution-failed', output: error.message }; }
}
async function executeVoiceTranscript(transcript) {
  const { parseDynamicCommand } = require('./dynamic-command'); const command = parseDynamicCommand(transcript);
  if (command.requiresConfirmation) return { ok: false, error: 'confirmation-required', dynamicCommand: command };
  const map = {
    'system.lock': { type: 'system', action: 'lock' }, 'system.volume.up': { type: 'system', action: 'volume', key: 'up' },
    'system.volume.down': { type: 'system', action: 'volume', key: 'down' }, 'system.volume.mute': { type: 'system', action: 'volume', key: 'mute' },
    'media.play_pause': { type: 'system', action: 'media', key: 'PLAY' }, 'media.next': { type: 'system', action: 'media', key: 'NEXT' }, 'media.previous': { type: 'system', action: 'media', key: 'PREVIOUS' },
  };
  if (command.intent === 'keyboard.shortcut') return executeKeyboard({ type: 'keyboard', action: 'press', key: command.key, modifiers: command.modifiers });
  if (command.intent === 'system.open') return openAllowed(command.target);
  if (map[command.intent]) return executeRemoteCommand(map[command.intent]);
  return { ok: false, error: 'voice-command-not-mapped', dynamicCommand: command };
}
module.exports = { requestOsUnlock, executeRemoteCommand, executeVoiceTranscript, getScreenReaderInfo };
