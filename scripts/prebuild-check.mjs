import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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

function runCapture(label, command, args, options = {}) {
  console.log(`\n=== ${label} ===`);
  try {
    execFileSync(command, args, { stdio: 'inherit', ...options });
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
      ['exec', 'tsc', '-p', 'tsconfig.prebuild.json', '--noEmit', '--pretty', 'false', '--noErrorTruncation', '--incremental', 'false'],
      { stdio: 'inherit' },
    );
    console.log('[PASS] TypeScript/TSX diagnostics');
    return true;
  } catch {
    console.error('[WARN] TypeScript/TSX diagnostics reported errors; continuing to the actual Expo Android bundle validation.');
    return true;
  }
}

function validateArchitectureBaseline() {
  console.log('\n=== React Native architecture baseline ===');
  const gradlePath = join(root, 'android', 'gradle.properties');
  const appJsonPath = join(root, 'app.json');
  const gradleText = readFileSync(gradlePath, 'utf8');
  const appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'));
  const gradleDisabled = /(^|\n)\s*newArchEnabled\s*=\s*false\s*(\n|$)/m.test(gradleText);
  const expoDisabled = appJson?.expo?.newArchEnabled === false;
  if (!gradleDisabled || !expoDisabled) {
    console.error('[FAIL] Production baseline requires New Architecture disabled in both app.json and android/gradle.properties.');
    return false;
  }
  console.log('[PASS] New Architecture is disabled consistently.');
  return true;
}

function validateLockfileAndReactNative() {
  console.log('\n=== React Native dependency baseline ===');
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const rnVersion = packageJson?.devDependencies?.['react-native'];
  if (!rnVersion || rnVersion !== '0.81.5') {
    console.error(`[FAIL] Expected pinned React Native 0.81.5, found ${rnVersion ?? 'missing'}.`);
    return false;
  }
  if (!existsSync(join(root, 'pnpm-lock.yaml'))) {
    console.error('[FAIL] pnpm-lock.yaml is missing; reproducible production installs require the lockfile.');
    return false;
  }
  const lockText = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8');
  const versions = [...lockText.matchAll(/react-native@(\d+\.\d+\.\d+)/g)].map((m) => m[1]);
  const unique = [...new Set(versions)];
  if (unique.length > 1 || (unique.length === 1 && unique[0] !== '0.81.5')) {
    console.error(`[FAIL] Multiple/unexpected React Native versions found in pnpm-lock.yaml: ${unique.join(', ')}`);
    return false;
  }
  console.log('[PASS] React Native version is pinned and lockfile contains a single RN version.');
  return true;
}

console.log('NexusPlus prebuild diagnostics');
console.log('Only errors that can actually prevent the Android bundle/build are blocking.');

walk(root);
sourceFiles.sort();
console.log(`JavaScript-family files discovered: ${sourceFiles.length}`);

let hardFailure = false;

for (const file of sourceFiles) {
  if (!runCapture(`Syntax: ${relative(root, file)}`, process.execPath, ['--check', file])) hardFailure = true;
}

runTypecheckDiagnostics();

if (!validateArchitectureBaseline()) hardFailure = true;
if (!validateLockfileAndReactNative()) hardFailure = true;

if (!runCapture('Expo configuration validation', 'pnpm', ['exec', 'expo', 'config', '--type', 'public'])) {
  hardFailure = true;
}

const exportDir = join('/tmp', 'nexusplus-prebuild-bundle-check');
if (!runCapture(
  'Expo Android bundle validation',
  'pnpm',
  ['exec', 'expo', 'export', '--platform', 'android', '--output-dir', exportDir, '--clear'],
)) {
  hardFailure = true;
}

if (hardFailure) {
  console.error('\nHard prebuild blocker detected. Paid EAS/Gradle Android build will NOT start.');
  process.exitCode = 1;
} else {
  console.log('\nNo hard prebuild blocker detected. Android build may proceed.');
}
