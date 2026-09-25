import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', '.expo', 'node_modules', 'android/build', 'android/app/build', 'coverage', 'dist', 'build', '.turbo']);
const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs']);
const sourceFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(root, full).replaceAll('\\', '/');
    if (ignored.has(rel) || [...ignored].some((p) => rel.startsWith(`${p}/`))) continue;
    if (entry.isDirectory()) walk(full);
    else if (sourceExtensions.has(full.slice(full.lastIndexOf('.')))) sourceFiles.push(full);
  }
}

function runCapture(label, command, args) {
  console.log(`\n=== ${label} ===`);
  try {
    execFileSync(command, args, { stdio: 'inherit' });
    console.log(`[PASS] ${label}`);
    return true;
  } catch {
    console.error(`[FAIL] ${label}`);
    return false;
  }
}

function runTypecheckDiagnostics() {
  console.log('\n=== TypeScript/TSX diagnostics (advisory) ===');
  console.log('TypeScript diagnostics are reported before Android compilation, but Metro/Gradle remain the source of truth for release build viability.');

  try {
    execFileSync(
      'pnpm',
      [
        'exec',
        'tsc',
        '-p',
        'tsconfig.prebuild.json',
        '--noEmit',
        '--pretty',
        'false',
        '--noErrorTruncation',
        '--incremental',
        'false',
      ],
      { stdio: 'inherit' },
    );
    console.log('[PASS] TypeScript/TSX diagnostics');
    return true;
  } catch {
    console.error('[WARN] TypeScript/TSX diagnostics reported errors; continuing to the actual Expo Android bundle validation.');
    return true;
  }
}

console.log('NexusPlus prebuild diagnostics');
console.log('Only errors that can actually prevent the Android bundle/build are blocking.');

walk(root);
sourceFiles.sort();
console.log(`JavaScript-family files discovered: ${sourceFiles.length}`);

let hardFailure = false;

for (const file of sourceFiles) {
  if (!runCapture(`Syntax: ${relative(root, file)}`, process.execPath, ['--check', file])) {
    hardFailure = true;
  }
}

runTypecheckDiagnostics();

if (!runCapture(
  'Expo configuration validation',
  'pnpm',
  ['exec', 'expo', 'config', '--type', 'public'],
)) {
  hardFailure = true;
}

const exportDir = join('/tmp', 'nexusplus-prebuild-bundle-check');
if (!runCapture(
  'Expo Android bundle validation',
  'pnpm',
  [
    'exec',
    'expo',
    'export',
    '--platform',
    'android',
    '--output-dir',
    exportDir,
    '--clear',
  ],
)) {
  hardFailure = true;
}

if (hardFailure) {
  console.error('\nHard prebuild blocker detected. Paid EAS/Gradle Android build will NOT start.');
  process.exitCode = 1;
} else {
  console.log('\nNo hard prebuild blocker detected. Android build may proceed.');
}
