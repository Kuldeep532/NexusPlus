import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
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
  } catch (error) {
    console.error(`[FAIL] ${label}`);
    process.exitCode = 1;
  }
}

console.log('NexusPlus prebuild source scan');
console.log('Checking all tracked JavaScript-family source files for syntax errors.');
walk(root);
sourceFiles.sort();
console.log(`JavaScript-family files discovered: ${sourceFiles.length}`);

for (const file of sourceFiles) {
  run(`Syntax: ${relative(root, file)}`, process.execPath, ['--check', file]);
}

run(
  'TypeScript/TSX: full repository source typecheck',
  'pnpm',
  ['exec', 'tsc', '-p', 'tsconfig.prebuild.json', '--noEmit', '--pretty', 'false', '--noErrorTruncation']
);

if (process.exitCode) {
  console.error('\nPrebuild source scan failed. EAS/Gradle build must not start.');
} else {
  console.log('\nPrebuild source scan passed. It is safe to continue to the build stage.');
}
