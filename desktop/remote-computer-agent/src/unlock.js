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
    await run('loginctl', ['unlock-sessions']);
    return { platform, action: 'unlock-sessions' };
  }
  throw new Error(`Unsupported desktop platform: ${platform}`);
}

module.exports = { requestOsUnlock };
