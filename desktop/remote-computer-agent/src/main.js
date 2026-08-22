const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const crypto = require('node:crypto');
const { WebSocketServer } = require('ws');
const keytar = require('keytar');
const { loadOrCreateIdentity } = require('./security');
const { requestOsUnlock, executeRemoteCommand, executeVoiceTranscript, getScreenReaderInfo } = require('./unlock');
const { parseDynamicCommand } = require('./dynamic-command');

const PORT = 47821;
const SERVICE = 'NexusPlus.RemoteComputer';
const PAIRED_PHONE = 'paired-phone-public-key';
const CHALLENGE_TTL_MS = 10_000;
const MAX_TRANSCRIPT_LENGTH = 4_000;
let mainWindow; let identity; let pairingCode; let pairedPhone;
function makeChallenge() { return crypto.randomBytes(32).toString('base64url'); }
function computerId() { return crypto.createHash('sha256').update(identity.publicKey).digest('hex').slice(0, 32); }
function send(socket, message) { if (socket.readyState === 1) socket.send(JSON.stringify(message)); }
function phonePublicKey() { return crypto.createPublicKey({ key: Buffer.from(pairedPhone, 'base64'), format: 'der', type: 'spki' }); }
function verifyPhoneSignature(challenge, signature) { if (!pairedPhone || typeof signature !== 'string') return false; return crypto.verify('sha256', Buffer.from(challenge), phonePublicKey(), Buffer.from(signature, 'base64')); }
function capabilities() { return ['keyboard', 'pointer', 'clipboard', 'voice-command', 'voice-receiving', 'audio-receiving', 'screen', 'screen-reader', 'unlock', 'lock', 'dynamic-command-lane', 'voice-media-control', 'voice-volume-control', 'voice-app-launch']; }
async function loadState() { identity = await loadOrCreateIdentity(); pairedPhone = await keytar.getPassword(SERVICE, PAIRED_PHONE); }

function startSocketServer() {
  const wss = new WebSocketServer({ host: '0.0.0.0', port: PORT, maxPayload: 1024 * 1024 });
  wss.on('connection', (socket) => {
    let pendingUnlockChallenge = null; let pendingCommand = null; socket.__pendingVoice = null; socket.__voiceHistory = [];
    send(socket, { type: 'agent_hello', protocol: 6, computerId: computerId(), publicKey: identity.publicKey, paired: Boolean(pairedPhone), screenReader: getScreenReaderInfo().kind, capabilities: capabilities() });
    socket.on('message', async (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type === 'pair_request') {
          if (!message.publicKey || typeof message.publicKey !== 'string') throw new Error('Phone public key is required.');
          pairingCode = String(Math.floor(100000 + Math.random() * 900000));
          send(socket, { type: 'pair_pending', computerId: computerId(), code: pairingCode }); mainWindow?.webContents.send('pairing-request', { publicKey: message.publicKey, code: pairingCode }); return;
        }
        if (message.type === 'pair_confirm') {
          if (!pairingCode || message.code !== pairingCode || !message.publicKey) throw new Error('Pairing confirmation is invalid.');
          pairedPhone = message.publicKey; await keytar.setPassword(SERVICE, PAIRED_PHONE, pairedPhone); pairingCode = undefined; send(socket, { type: 'pair_success' }); return;
        }
        if (message.type === 'unlock_request') {
          if (!pairedPhone || message.computerId !== computerId()) throw new Error('This phone is not paired with the computer.');
          pendingUnlockChallenge = { value: makeChallenge(), expiresAt: Date.now() + CHALLENGE_TTL_MS }; send(socket, { type: 'unlock_challenge', challenge: pendingUnlockChallenge.value }); return;
        }
        if (message.type === 'unlock_response') {
          const pending = pendingUnlockChallenge;
          if (!pairedPhone || message.publicKey !== pairedPhone || !pending || Date.now() > pending.expiresAt || message.challenge !== pending.value || !verifyPhoneSignature(pending.value, message.signature)) throw new Error('Phone signature verification failed or challenge expired.');
          pendingUnlockChallenge = null; const result = await requestOsUnlock(); send(socket, { type: 'unlock_result', ok: true, result }); return;
        }
        if (message.type === 'command_request') {
          if (!pairedPhone || message.computerId !== computerId()) throw new Error('This phone is not paired with the computer.');
          if (!message.commandId || typeof message.commandId !== 'string' || message.commandId.length > 128) throw new Error('Command ID is required.');
          pendingCommand = { commandId: message.commandId, source: message.source, transcript: String(message.transcript || '').slice(0, MAX_TRANSCRIPT_LENGTH), challenge: makeChallenge(), expiresAt: Date.now() + CHALLENGE_TTL_MS };
          send(socket, { type: 'command_challenge', challenge: pendingCommand.challenge }); return;
        }
        if (message.type === 'command_response') {
          if (!pairedPhone || message.publicKey !== pairedPhone || !pendingCommand || message.request?.commandId !== pendingCommand.commandId || Date.now() > pendingCommand.expiresAt) throw new Error('Invalid or expired command authorization.');
          if (message.challenge !== pendingCommand.challenge || !verifyPhoneSignature(pendingCommand.challenge, message.signature)) throw new Error('Phone signature verification failed.');
          const current = pendingCommand; pendingCommand = null; const result = await executeRemoteCommand(message.request?.command);
          send(socket, { type: 'command_result', result: { commandId: current.commandId, ...result } }); return;
        }
        if (message.type === 'voice_transcript') {
          if (!pairedPhone || message.publicKey !== pairedPhone || typeof message.transcript !== 'string' || message.transcript.length > MAX_TRANSCRIPT_LENGTH) throw new Error('Invalid voice transcript.');
          const now = Date.now(); socket.__voiceHistory = socket.__voiceHistory.filter((time) => now - time < 60_000);
          if (socket.__voiceHistory.length >= 30) throw new Error('Voice command rate limit exceeded.'); socket.__voiceHistory.push(now);
          const transcript = message.transcript.trim(); if (!transcript) throw new Error('Voice transcript is empty.');
          const challenge = makeChallenge(); socket.__pendingVoice = { challenge, transcript, expiresAt: now + CHALLENGE_TTL_MS }; send(socket, { type: 'voice_challenge', challenge, expiresInMs: CHALLENGE_TTL_MS }); return;
        }
        if (message.type === 'voice_response') {
          const pending = socket.__pendingVoice;
          if (!pending || !pairedPhone || message.publicKey !== pairedPhone || message.challenge !== pending.challenge || Date.now() > pending.expiresAt || !verifyPhoneSignature(pending.challenge, message.signature)) throw new Error('Voice authorization failed or challenge expired.');
          socket.__pendingVoice = null; const dynamicCommand = parseDynamicCommand(pending.transcript); const result = await executeVoiceTranscript(pending.transcript);
          send(socket, { type: 'voice_result', ok: result.ok, output: result.output, error: result.error, dynamicCommand }); return;
        }
        if (message.type === 'voice_audio') {
          if (!pairedPhone || message.publicKey !== pairedPhone || typeof message.chunk !== 'string' || message.chunk.length > 512000) throw new Error('Invalid voice audio frame.');
          send(socket, { type: 'voice_audio_ack', sequence: message.sequence ?? null }); return;
        }
        if (message.type === 'ping') send(socket, { type: 'pong' });
      } catch (error) { send(socket, { type: 'error', code: 'REMOTE_REQUEST_REJECTED', message: error.message }); }
    });
  });
  return wss;
}
function createWindow() { mainWindow = new BrowserWindow({ width: 720, height: 620, minWidth: 560, minHeight: 480, webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } }); mainWindow.loadFile(path.join(__dirname, 'index.html')); }
ipcMain.handle('agent-state', async () => ({ port: PORT, paired: Boolean(pairedPhone), computerId: computerId(), platform: process.platform, screenReader: getScreenReaderInfo().kind, capabilities: capabilities(), voiceProtocol: 6 }));
ipcMain.handle('forget-phone', async () => { pairedPhone = undefined; await keytar.deletePassword(SERVICE, PAIRED_PHONE); return { paired: false }; });
app.whenReady().then(async () => { await loadState(); startSocketServer(); createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
