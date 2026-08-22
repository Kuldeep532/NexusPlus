const { execFile } = require('node:child_process');
const os = require('node:os');

function run(command, args = []) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: 5000, windowsHide: true }, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve(stdout.trim());
    });
  });
}

async function requestOsUnlock() {
  const platform = os.platform();
  if (platform === 'win32') {
    throw new Error('Windows OS unlock requires the installed Nexus credential-provider/helper. Standard user applications cannot bypass the Windows sign-in credential UI.');
  }
  if (platform === 'darwin') {
    throw new Error('macOS login unlock requires the installed Nexus authorization helper and an enrolled user policy. Standard applications cannot bypass the login credential UI.');
  }
  if (platform === 'linux') {
    const sessionId = process.env.XDG_SESSION_ID;
    if (!sessionId || !/^[A-Za-z0-9._-]+$/.test(sessionId)) {
      throw new Error('No safe active Linux session identifier is available for unlock. Configure the desktop agent inside the target user session.');
    }
    await run('loginctl', ['unlock-session', sessionId]);
    return { platform, action: `unlock-session:${sessionId}` };
  }
  throw new Error(`Unsupported desktop platform: ${platform}`);
}

module.exports = { requestOsUnlock };
