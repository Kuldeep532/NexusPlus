import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', '.expo', 'node_modules', 'android/build', 'android/app/build', 'coverage', 'dist', 'build']);
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

function run(label, command, args) {
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

console.log('NexusPlus prebuild source scan');
console.log('Checking JavaScript-family syntax before any paid build starts.');
walk(root);
sourceFiles.sort();
console.log(`JavaScript-family files discovered: ${sourceFiles.length}`);

let failed = false;
for (const file of sourceFiles) {
  if (!run(`Syntax: ${relative(root, file)}`, process.execPath, ['--check', file])) failed = true;
}

// Run the complete TypeScript application-source scan exactly once.
// The compiler is configured to emit the full diagnostic set instead of
// stopping at the first reported problem. Keep the output untruncated.
const typecheckPassed = run(
  'TypeScript/TSX: complete application source typecheck',
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
);
if (!typecheckPassed) failed = true;

if (failed) {
  console.error('\nPrebuild source scan failed. EAS/Gradle build must not start.');
  process.exitCode = 1;
} else {
  console.log('\nPrebuild source scan passed. It is safe to continue to the build stage.');
}
