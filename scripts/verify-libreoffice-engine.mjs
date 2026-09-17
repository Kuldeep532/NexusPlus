#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const jniRoot = path.join(root, 'android', 'app', 'src', 'main', 'jniLibs');
const abis = ['arm64-v8a', 'armeabi-v7a'];
const requiredNames = ['liblo-native-code.so'];

let ok = true;
for (const abi of abis) {
  for (const name of requiredNames) {
    const file = path.join(jniRoot, abi, name);
    if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
      console.error(`Missing LibreOfficeKit engine payload: ${path.relative(root, file)}`);
      ok = false;
    } else {
      console.log(`Found LibreOfficeKit engine payload: ${path.relative(root, file)}`);
    }
  }
}

if (!ok) {
  console.error('LibreOfficeKit Android engine payload is incomplete. The PDF <-> DOCX feature cannot be considered production-ready.');
  process.exit(1);
}

console.log('LibreOfficeKit Android engine payload check passed.');
