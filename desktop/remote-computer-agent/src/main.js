const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const crypto = require('node:crypto');
const { WebSocketServer } = require('ws');
const keytar = require('keytar');
const { loadOrCreateIdentity } = require('./security');
const { requestOsUnlock } = require('./unlock');

const PORT = 47821;
const SERVICE = 'NexusPlus.RemoteComputer';
const PAIRED_PHONE = 'paired-phone-public-key';
let mainWindow;
let identity;
let pairingCode;
let pairedPhone;

function makeChallenge() {
  return crypto.randomBytes(32).toString('base64url');
}

async function loadState() {
  identity = await loadOrCreateIdentity();
  pairedPhone = await keytar.getPassword(SERVICE, PAIRED_PHONE);
}

function send(socket, message) {
  if (socket.readyState === 1) socket.send(JSON.stringify(message));
}

function startSocketServer() {
  const wss = new WebSocketServer({ host: '0.0.0.0', port: PORT, maxPayload: 128 * 1024 });
  wss.on('connection', (socket) => {
    let pendingChallenge = null;

    send(socket, {
      type: 'agent_hello',
      protocol: 2,
      computerId: crypto.createHash('sha256').update(identity.publicKey).digest('hex').slice(0, 32),
      publicKey: identity.publicKey,
      paired: Boolean(pairedPhone),
    });

    socket.on('message', async (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type === 'pair_request') {
          if (!message.publicKey || typeof message.publicKey !== 'string') throw new Error('Phone public key is required.');
          pairingCode = String(Math.floor(100000 + Math.random() * 900000));
          send(socket, { type: 'pair_pending', code: pairingCode });
          mainWindow?.webContents.send('pairing-request', { publicKey: message.publicKey, code: pairingCode });
          return;
        }

        if (message.type === 'pair_confirm') {
          if (!pairingCode || message.code !== pairingCode || !message.publicKey) throw new Error('Pairing confirmation is invalid.');
          pairedPhone = message.publicKey;
          await keytar.setPassword(SERVICE, PAIRED_PHONE, pairedPhone);
          pairingCode = undefined;
          send(socket, { type: 'pair_success' });
          return;
        }

        if (message.type === 'unlock_request') {
          if (!pairedPhone) throw new Error('No phone is paired with this computer.');
          pendingChallenge = makeChallenge();
          send(socket, { type: 'unlock_challenge', challenge: pendingChallenge });
          return;
        }

        if (message.type === 'unlock_response') {
          if (!pairedPhone || message.publicKey !== pairedPhone) throw new Error('Unpaired phone.');
          if (!pendingChallenge || message.challenge !== pendingChallenge) throw new Error('Challenge is missing, expired, or does not match.');
          const publicKey = crypto.createPublicKey({ key: Buffer.from(pairedPhone, 'base64'), format: 'der', type: 'spki' });
          const valid = crypto.verify('sha256', Buffer.from(pendingChallenge), publicKey, Buffer.from(message.signature, 'base64'));
          pendingChallenge = null;
          if (!valid) throw new Error('Phone signature verification failed.');
          const result = await requestOsUnlock();
          send(socket, { type: 'unlock_result', ok: true, result });
          return;
        }

        if (message.type === 'ping') send(socket, { type: 'pong' });
      } catch (error) {
        send(socket, { type: 'error', code: 'REMOTE_REQUEST_REJECTED', message: error.message });
      }
    });
  });
  return wss;
}

function createWindow() {
  mainWindow = new BrowserWindow({ width: 720, height: 620, minWidth: 560, minHeight: 480, webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('agent-state', async () => ({ port: PORT, paired: Boolean(pairedPhone), computerId: crypto.createHash('sha256').update(identity.publicKey).digest('hex').slice(0, 32), platform: process.platform }));
ipcMain.handle('forget-phone', async () => { pairedPhone = undefined; await keytar.deletePassword(SERVICE, PAIRED_PHONE); return { paired: false }; });

app.whenReady().then(async () => {
  await loadState();
  startSocketServer();
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
