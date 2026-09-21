import { addVaultItemWithAuthentication } from '@/features/biometric-vault/secureVaultService';

export async function saveNoteToSecureVault(note: {
  title: string;
  content: string;
  attachments: Array<{ kind: string; uri: string; mimeType?: string; name?: string; durationMs?: number }>;
}): Promise<void> {
  await addVaultItemWithAuthentication({
    category: 'SECURE_NOTE',
    kind: note.attachments.length > 1 ? 'MIXED' : note.attachments[0]?.kind === 'AUDIO' ? 'AUDIO' : note.attachments[0]?.kind === 'IMAGE' ? 'IMAGE' : note.attachments[0]?.kind === 'DRAWING' ? 'DRAWING' : 'TEXT',
    title: note.title,
    content: note.content,
    attachments: note.attachments
      .filter((item) => item.kind === 'AUDIO' || item.kind === 'IMAGE' || item.kind === 'DRAWING')
      .map((item, index) => ({
        id: 'secure-note-attachment-' + Date.now().toString(36) + '-' + index,
        kind: item.kind as 'AUDIO'|'IMAGE'|'DRAWING',
        uri: item.uri,
        mimeType: item.mimeType,
        name: item.name,
        durationMs: item.durationMs,
      })),
    tags: note.attachments.map((item) => item.kind.toLowerCase()),
  }, 'Authenticate to save this note in Secure Vault.');
}
