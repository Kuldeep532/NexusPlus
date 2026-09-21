import { readVault, writeVault } from '@/features/biometric-vault/biometricVaultRepository';

export async function saveNoteToSecureVault(note: {
  title: string;
  content: string;
  attachments: Array<{ kind: string; uri: string; mimeType?: string; name?: string; durationMs?: number }>;
}): Promise<void> {
  const snapshot = await readVault();
  const now = Date.now();
  const secureNote = {
    id: 'secure-note-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    category: 'SECURE_NOTE' as const,
    title: note.title,
    content: note.content + (note.attachments.length ? '\n\nAttachments:\n' + note.attachments.map((item) => item.kind + ': ' + item.uri).join('\n') : ''),
    tags: note.attachments.map((item) => item.kind.toLowerCase()),
    createdAt: now,
    updatedAt: now,
  };
  await writeVault([secureNote, ...snapshot.items], snapshot.keyVersion);
}
