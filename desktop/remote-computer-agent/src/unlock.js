const { execFile } = require('node:child_process');
const os = require('node:os');

function run(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: options.timeout ?? 5000, windowsHide: true, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(String(stderr || error.message).trim()));
      resolve(String(stdout).trim());
    });
  });
}

async function requestOsUnlock() {
  const platform = os.platform();
  if (platform === 'win32') throw new Error('Windows pre-login unlock requires the installed Nexus Credential Provider/helper. Standard applications cannot bypass Windows sign-in.');
  if (platform === 'darwin') throw new Error('macOS login unlock requires the installed Nexus authorization helper and enrolled user policy. Standard applications cannot bypass the login credential UI.');
  if (platform === 'linux') { await run('loginctl', ['unlock-sessions']); return { platform, action: 'unlock-sessions' }; }
  throw new Error(`Unsupported desktop platform: ${platform}`);
}

function getScreenReaderInfo() {
  const platform = os.platform();
  if (platform === 'win32') return { kind: 'nvda', available: true, integration: 'keyboard-shortcuts/controller-helper' };
  if (platform === 'darwin') return { kind: 'voiceover', available: true, integration: 'VoiceOver keyboard shortcuts/AppleScript helper' };
  if (platform === 'linux') return { kind: 'orca', available: true, integration: 'Orca keyboard shortcuts/AT-SPI helper' };
  return { kind: 'unknown', available: false, integration: 'none' };
}

function validKey(key) { return typeof key === 'string' && /^[A-Za-z0-9_+\-\.]+$/.test(key) && key.length <= 40; }
function validModifiers(modifiers) { return Array.isArray(modifiers) && modifiers.length <= 4 && modifiers.every((m) => /^(CTRL|ALT|SHIFT|META|WIN|CMD|COMMAND|CONTROL)$/i.test(m)); }

async function executeRemoteCommand(command, meta = {}) {
  if (!command || typeof command !== 'object' || typeof command.type !== 'string') return { ok: false, error: 'invalid-command' };
  try {
    if (command.type === 'keyboard' && command.action === 'press') {
      if (!validKey(command.key) || (command.modifiers !== undefined && !validModifiers(command.modifiers))) return { ok: false, error: 'invalid-command' };
      const parts = [...(command.modifiers || []), command.key].map((x) => String(x).toUpperCase());
      if (os.platform() === 'linux') await run('xdotool', ['key', parts.join('+')]);
      else if (os.platform() === 'darwin') await run('osascript', ['-e', `tell application "System Events" to keystroke "${command.key.replace(/"/g, '')}"`]);
      else await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `$ws=New-Object -ComObject WScript.Shell; $ws.SendKeys('${command.key.replace(/'/g, "''")}')`]);
      return { ok: true, output: `Pressed ${parts.join('+')}` };
    }

    if (command.type === 'clipboard') {
      if (command.action === 'read') {
        if (os.platform() === 'darwin') return { ok: true, output: await run('pbpaste') };
        if (os.platform() === 'linux') return { ok: true, output: await run('xclip', ['-selection', 'clipboard', '-o']) };
        return { ok: true, output: await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Get-Clipboard']) };
      }
      if (command.action === 'write' && typeof command.text === 'string' && command.text.length <= 100000) {
        if (os.platform() === 'darwin') await run('pbcopy', [], { timeout: 5000 });
        else if (os.platform() === 'linux') await run('xclip', ['-selection', 'clipboard']);
        else await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Set-Clipboard -Value '${command.text.replace(/'/g, "''")}'`]);
        return { ok: true, output: 'Clipboard updated.' };
      }
      return { ok: false, error: 'invalid-command' };
    }

    if (command.type === 'screen-reader') {
      if (command.action === 'pause' || command.action === 'resume' || command.action === 'next' || command.action === 'previous') {
        // Reader-specific shortcuts are deliberately delegated to the platform's accessibility helper in production.
        return { ok: false, error: 'unsupported' };
      }
      if (command.action === 'read-current') return { ok: false, error: 'unsupported' };
    }

    if (command.type === 'pointer') return { ok: false, error: 'unsupported' };
    if (command.type === 'system' && command.action === 'lock') {
      if (os.platform() === 'linux') await run('loginctl', ['lock-sessions']);
      else if (os.platform() === 'darwin') await run('/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession', ['-suspend']);
      else await run('rundll32.exe', ['user32.dll,LockWorkStation']);
      return { ok: true, output: 'Computer locked.' };
    }
    if (command.type === 'system' && command.action === 'sleep') return { ok: false, error: 'policy-denied' };
    return { ok: false, error: 'unsupported' };
  } catch (error) {
    return { ok: false, error: 'execution-failed', output: error.message };
  }
}

module.exports = { requestOsUnlock, executeRemoteCommand, getScreenReaderInfo };
