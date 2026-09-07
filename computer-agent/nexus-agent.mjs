#!/usr/bin/env node
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import process from 'node:process';
import { URL } from 'node:url';

const execFileAsync = promisify(execFile);
const PORT = Number(process.env.NEXUS_COMPUTER_AGENT_PORT || 49152);
const HOST = process.env.NEXUS_COMPUTER_AGENT_HOST || '0.0.0.0';
const MAX_BODY = 32 * 1024;
const PROTOCOL_VERSION = '1';
const TOKEN = process.env.NEXUS_COMPUTER_AGENT_TOKEN || '';

function json(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': 'http://localhost',
  });
  res.end(JSON.stringify(payload));
}

function commandAllowed(action) {
  return new Set(['system-info', 'power-state', 'open-url', 'open-file', 'open-folder', 'launch-app']).has(action);
}

function assertToken(req) {
  return !TOKEN || req.headers['x-nexus-agent-token'] === TOKEN;
}

async function runOpen(target, extraArgs = []) {
  if (process.platform === 'win32') {
    return execFileAsync('cmd.exe', ['/c', 'start', '', target, ...extraArgs]);
  }
  if (process.platform === 'darwin') {
    return execFileAsync('open', [target, ...extraArgs]);
  }
  return execFileAsync('xdg-open', [target, ...extraArgs]);
}

async function runLaunchApp(app) {
  if (process.platform === 'win32') return execFileAsync('cmd.exe', ['/c', 'start', '', app]);
  if (process.platform === 'darwin') return execFileAsync('open', ['-a', app]);
  return execFileAsync('sh', ['-lc', `command -v "$1" >/dev/null 2>&1 && exec "$1" || (command -v gtk-launch >/dev/null 2>&1 && exec gtk-launch "$1")`, 'nexus-launch', app]);
}

function platformName() {
  if (process.platform === 'win32') return 'windows';
  if (process.platform === 'darwin') return 'macos';
  if (process.platform === 'linux') return 'linux';
  return process.platform;
}

async function execute(action, args = {}) {
  if (!commandAllowed(action)) throw new Error('Action is not allow-listed.');
  switch (action) {
    case 'system-info':
      return {
        platform: platformName(),
        hostname: os.hostname(),
        arch: process.arch,
        release: os.release(),
        agentVersion: '1.0.0',
        protocolVersion: PROTOCOL_VERSION,
        capabilities: ['system-info', 'power-state', 'open-url', 'open-file', 'open-folder', 'launch-app'],
      };
    case 'power-state':
      return { supported: false, message: 'Power-state inspection uses the host operating system and is optional.' };
    case 'open-url':
      if (!/^https?:\/\//i.test(String(args.url || ''))) throw new Error('Only HTTP(S) URLs are supported.');
      await runOpen(String(args.url));
      return { message: 'URL opened with the operating system default browser.' };
    case 'open-file':
      await runOpen(String(args.path || ''));
      return { message: 'File opened with the operating system default application.' };
    case 'open-folder':
      await runOpen(String(args.path || ''));
      return { message: 'Folder opened with the operating system default file manager.' };
    case 'launch-app':
      await runLaunchApp(String(args.app || ''));
      return { message: 'Application launch requested through the operating system.' };
    default:
      throw new Error('Unsupported action.');
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': 'http://localhost',
        'Access-Control-Allow-Headers': 'content-type,x-nexus-agent-token,x-nexus-protocol',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      });
      return res.end();
    }
    if (!assertToken(req)) return json(res, 401, { ok: false, error: 'Unauthorized.' });

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/v1/health') {
      return json(res, 200, { ok: true, service: 'nexus-computer-agent', protocolVersion: PROTOCOL_VERSION, platform: platformName() });
    }
    if (req.method === 'POST' && url.pathname === '/v1/execute') {
      if (req.headers['x-nexus-protocol'] !== PROTOCOL_VERSION) return json(res, 426, { ok: false, error: 'Unsupported Nexus protocol version.' });
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body, 'utf8') > MAX_BODY) throw new Error('Request body too large.');
      }
      const input = JSON.parse(body || '{}');
      const data = await execute(String(input.action || ''), input.args || {});
      return json(res, 200, { ok: true, requestId: input.requestId, message: data.message, data });
    }
    return json(res, 404, { ok: false, error: 'Not found.' });
  } catch (error) {
    return json(res, 400, { ok: false, error: error instanceof Error ? error.message : 'Request failed.' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Nexus Computer Agent listening on http://${HOST}:${PORT} (${platformName()})`);
});
