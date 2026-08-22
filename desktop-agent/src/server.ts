import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createAdapter } from './adapters';
import { detectPlatform, getCapabilities, getComputerName } from './platform';
import type { CommandEnvelope, PairingRequest } from './types';

const PORT = Number(process.env.NEXUS_AGENT_PORT ?? 47821);
const computerId = createHash('sha256').update(`${getComputerName()}:${process.platform}`).digest('hex').slice(0, 24);
const capabilities = getCapabilities();
const adapter = createAdapter(capabilities);
let pairedPublicKey = '';
let pairingCode = '';

function newCode() { return randomBytes(4).toString('hex').toUpperCase(); }
function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a); const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

const server = new WebSocketServer({ host: process.env.NEXUS_AGENT_HOST ?? '127.0.0.1', port: PORT, maxPayload: 256 * 1024 });
server.on('connection', socket => {
  socket.send(JSON.stringify({ type: 'agent-info', computerId, computerName: getComputerName(), platform: detectPlatform(), capabilities }));
  socket.on('message', async raw => {
    try {
      const message = JSON.parse(raw.toString()) as Record<string, unknown>;
      if (message.type === 'pair') {
        const request = message.request as PairingRequest;
        if (!request?.publicKey || !request.keyId || !request.nonce) throw new Error('invalid-pairing');
        pairingCode = newCode();
        socket.send(JSON.stringify({ type: 'pairing-code', computerId, computerName: getComputerName(), platform: detectPlatform(), pairingCode, publicKey: request.publicKey }));
        return;
      }
      if (message.type === 'pair-confirm') {
        const code = String(message.code ?? '');
        if (!pairingCode || !safeEqual(code, pairingCode)) { socket.send(JSON.stringify({ type: 'error', error: 'invalid-pairing-code' })); return; }
        pairedPublicKey = String(message.publicKey ?? '');
        pairingCode = '';
        socket.send(JSON.stringify({ type: 'paired', computerId }));
        return;
      }
      if (message.type === 'voice-transcript') {
        const result = await adapter.receiveVoiceTranscript(String(message.transcript ?? ''));
        socket.send(JSON.stringify({ type: 'voice-result', ok: result.ok, output: result.output, error: result.error }));
        return;
      }
      if (message.type === 'command') {
        if (!pairedPublicKey) { socket.send(JSON.stringify({ type: 'command-result', ok: false, error: 'not-paired' })); return; }
        const envelope = message.envelope as CommandEnvelope;
        if (!envelope?.commandId || envelope.computerId !== computerId || !envelope.command) { socket.send(JSON.stringify({ type: 'command-result', ok: false, error: 'invalid-command' })); return; }
        const result = await adapter.execute(envelope.command);
        socket.send(JSON.stringify({ type: 'command-result', commandId: envelope.commandId, ok: result.ok, output: result.output, error: result.error }));
      }
    } catch { socket.send(JSON.stringify({ type: 'error', error: 'invalid-message' })); }
  });
});

console.log(`Nexus Plus Remote Agent listening on 127.0.0.1:${PORT}`);
console.log(`Computer: ${getComputerName()} | Platform: ${detectPlatform()}`);
console.log(`Capabilities: ${JSON.stringify(capabilities)}`);
