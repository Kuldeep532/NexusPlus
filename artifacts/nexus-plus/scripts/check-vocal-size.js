const fs = require('fs');
const path = require('path');

const HARD_LIMIT = 100 * 1024 * 1024;
const projectRoot = path.resolve(__dirname, '..');

function sizeOf(file) {
  try {
    return fs.statSync(file).size;
  } catch {
    return 0;
  }
}

function findArtifacts() {
  const roots = [
    path.join(projectRoot, 'android', 'app', 'build', 'outputs', 'apk'),
    path.join(projectRoot, 'android', 'app', 'build', 'outputs', 'bundle'),
  ];
  const files = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(apk|aab)$/i.test(entry.name)) files.push(full);
    }
  };
  roots.forEach(walk);
  return files;
}

const artifacts = findArtifacts();
if (artifacts.length === 0) {
  console.log('No APK/AAB artifact found; size check skipped.');
  process.exit(0);
}

let failed = false;
for (const artifact of artifacts) {
  const bytes = sizeOf(artifact);
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  console.log(`${path.relative(projectRoot, artifact)}: ${mb} MB`);
  if (bytes > HARD_LIMIT) {
    console.error(`ERROR: ${artifact} exceeds the 100 MB limit.`);
    failed = true;
  }
}

if (failed) process.exit(1);
