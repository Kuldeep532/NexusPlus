import * as FileSystem from 'expo-file-system/legacy';
import { PdfNativeBridge } from '@/features/pdf-native/PdfNativeBridge';
import { unlockPdfWithEngine } from '@/features/protect-pdf/protectPdfEngine';
import type { ProtectPdfInput } from '@/features/protect-pdf/protectPdfTypes';
import { savePdfPasswordToVault } from '@/features/protect-pdf/protect-pdf-vault';

export type AssistantPdfAttachment = {
  uri: string;
  name: string;
};

export type AssistantPdfCommand =
  | { kind: 'lock'; password: string }
  | { kind: 'unlock'; password: string }
  | { kind: 'compress'; quality: number }
  | { kind: 'rotate'; degrees: 90 | 180 | 270 };

function safeBaseName(name: string): string {
  return name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'document';
}

function requireAttachment(attachment: AssistantPdfAttachment | null): AssistantPdfAttachment {
  if (!attachment?.uri) throw new Error('Attach a local PDF to use this PDF command.');
  return attachment;
}

export function parseAssistantPdfCommand(text: string): AssistantPdfCommand | null {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();

  let match = /^\/lock(?:\s+pdf)?(?:\s*\/\s*password)?\s+(.+)$/i.exec(normalized)
    ?? /^lock(?:\s+pdf)?(?:\s+with)?\s+password\s+(.+)$/i.exec(normalized);
  if (match) return { kind: 'lock', password: match[1].trim() };

  match = /^\/unlock(?:\s+pdf)?(?:\s*\/\s*password)?\s+(.+)$/i.exec(normalized)
    ?? /^unlock(?:\s+pdf)?(?:\s+with)?\s+password\s+(.+)$/i.exec(normalized);
  if (match) return { kind: 'unlock', password: match[1].trim() };

  match = /^\/?compress(?:\s+pdf)?(?:\s+(\d{1,3}))?$/i.exec(lower);
  if (match) return { kind: 'compress', quality: Math.max(1, Math.min(100, Number(match[1] ?? 75))) };

  match = /^\/?rotate(?:\s+pdf)?(?:\s+(90|180|270))$/i.exec(lower);
  if (match) return { kind: 'rotate', degrees: Number(match[1]) as 90 | 180 | 270 };

  return null;
}

export function isSensitivePdfCommand(command: AssistantPdfCommand): boolean {
  return command.kind === 'lock' || command.kind === 'unlock';
}

export async function executeAssistantPdfCommand(
  command: AssistantPdfCommand,
  attachment: AssistantPdfAttachment,
): Promise<{ uri: string | null; message: string; name?: string }> {
  const pdf = requireAttachment(attachment);

  if (command.kind === 'lock') {
    if (command.password.length < 8) throw new Error('PDF password must be at least 8 characters.');
    const output = await PdfNativeBridge.preparePdfToolOutput('PDF Tools - Lock and Unlock', safeBaseName(pdf.name) + '-locked.pdf');
    await PdfNativeBridge.protect(pdf.uri, output, command.password);
    await savePdfPasswordToVault(pdf.name, command.password);
    return {
      uri: output,
      name: safeBaseName(pdf.name) + '-locked.pdf',
      message: 'PDF locked successfully and saved to Nexus Plus PDF Tools.',
    };
  }

  if (command.kind === 'unlock') {
    const result = await unlockPdfWithEngine(pdf as ProtectPdfInput, command.password);
    const output = await PdfNativeBridge.preparePdfToolOutput('PDF Tools - Lock and Unlock', safeBaseName(pdf.name) + '-unlocked.pdf');
    if (result.uri !== output) await FileSystem.copyAsync({ from: result.uri, to: output });
    return {
      uri: output,
      name: safeBaseName(pdf.name) + '-unlocked.pdf',
      message: 'PDF unlocked successfully and saved to Nexus Plus PDF Tools.',
    };
  }

  if (command.kind === 'compress') {
    const output = await PdfNativeBridge.preparePdfToolOutput('PDF Tools - Compress', safeBaseName(pdf.name) + '-compressed.pdf');
    await PdfNativeBridge.compress(pdf.uri, output, command.quality);
    return {
      uri: output,
      name: safeBaseName(pdf.name) + '-compressed.pdf',
      message: 'PDF compressed successfully and saved to Nexus Plus PDF Tools.',
    };
  }

  const output = await PdfNativeBridge.preparePdfToolOutput('PDF Tools - Rotate', safeBaseName(pdf.name) + '-rotated-' + command.degrees + '.pdf');
  await PdfNativeBridge.rotate(pdf.uri, output, ['1-999999'], command.degrees);
  return {
    uri: output,
    name: safeBaseName(pdf.name) + '-rotated-' + command.degrees + '.pdf',
    message: 'PDF rotated successfully and saved to Nexus Plus PDF Tools.',
  };
}
