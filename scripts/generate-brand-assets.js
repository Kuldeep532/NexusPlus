#!/usr/bin/env node
/*
 * Deterministic Nexus Plus branding asset generator.
 * Source of truth: features/branding/NexusBrandMark.tsx design primitives.
 * Generates PNG assets for Expo/Android/Play Store from a vector-equivalent SVG.
 *
 * This script intentionally contains no external network access and writes only
 * generated branding artifacts under assets/generated-branding/.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'assets', 'generated-branding');
fs.mkdirSync(outDir, { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="nexusMark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7C3AED"/>
      <stop offset="0.55" stop-color="#EC4899"/>
      <stop offset="1" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <circle cx="48" cy="48" r="44" fill="#FFF7ED" stroke="#F59E0B" stroke-width="2"/>
  <path d="M48 17c7 9 11 17 11 25 0 12-8 22-11 27-3-5-11-15-11-27 0-8 4-16 11-25Z" fill="url(#nexusMark)"/>
  <path d="M21 58c7-8 17-12 27-12 10 0 20 4 27 12-10-3-19-4-27-4s-17 1-27 4Z" fill="#FDE68A"/>
  <path d="M29 70c6-4 12-5 19-5 7 0 13 1 19 5-9 7-29 7-38 0Z" fill="#7C3AED" opacity="0.9"/>
  <circle cx="44" cy="37" r="2.5" fill="#FFFFFF"/>
  <circle cx="52" cy="37" r="2.5" fill="#FFFFFF"/>
</svg>`;

const svgPath = path.join(outDir, 'nexus-plus-mark.svg');
fs.writeFileSync(svgPath, svg, 'utf8');

function ensureCommand(name) {
  try {
    execFileSync(name, ['--version'], { stdio: 'ignore' });
  } catch {
    throw new Error(`Required image conversion tool '${name}' is unavailable.`);
  }
}

ensureCommand('rsvg-convert');
for (const size of [48, 72, 96, 144, 192, 512, 1024]) {
  const output = path.join(outDir, `nexus-plus-${size}.png`);
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), '-o', output, svgPath], { stdio: 'inherit' });
}

console.log(`Generated deterministic Nexus Plus branding assets in ${path.relative(root, outDir)}.`);
