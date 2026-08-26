import type { FileManagerEntry } from './FileManagerTypes';
import { isSecureFile } from './FileManagerSecureService';

export function secureEntries(entries: FileManagerEntry[]): FileManagerEntry[] {
  return entries.filter((entry) => !entry.isDirectory && isSecureFile(entry.name));
}

export function encryptableEntries(entries: FileManagerEntry[]): FileManagerEntry[] {
  return entries.filter((entry) => !entry.isDirectory && !isSecureFile(entry.name));
}
