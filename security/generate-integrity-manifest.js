#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = process.cwd();
const outputPath = path.join(root, 'security', 'integrity-manifest.json');

const protectedFiles = [
  'app/voices.tsx',
  'features/voice-library/voiceCatalog.ts',
  'features/voice-library/voiceDownloadGuard.ts',
  'features/voice-library/voiceStore.ts',
  'features/nexus-assistant/assistantConfig.ts',
  'features/nexus-assistant/modelManager.ts',
  'features/nexus-assistant/stage6Voice.ts',
  'features/nexus-assistant/stage7VoiceBridge.ts',
  'features/nexus-assistant/stage8AssetManager.ts',
];

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const files = {};
for (const relativePath of protectedFiles) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`Integrity target missing: ${relativePath}`);
  files[relativePath] = sha256(absolutePath);
}

const payload = JSON.stringify(files, Object.keys(files).sort());
const manifestHash = crypto.createHash('sha256').update(payload).digest('hex');

const manifest = {
  version: 1,
  algorithm: 'SHA-256',
  generatedAt: new Date().toISOString(),
  manifestHash,
  files,
  policy: {
    verifyOnStartup: true,
    verifyBeforeVoiceDownload: true,
    verifyBeforeSensitiveAction: true,
    failClosedOnMismatch: true,
    telemetry: 'minimal-security-events-only',
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
console.log(`Manifest SHA-256: ${manifestHash}`);
