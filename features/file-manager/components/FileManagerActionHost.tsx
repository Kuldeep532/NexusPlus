import { Alert } from 'react-native';
import { useState } from 'react';
import type { FileManagerEntry, FileManagerSelectionAction } from '../FileManagerTypes';
import { FileManagerActionSheet } from './FileManagerActionSheet';
import { FileManagerPropertiesSheet } from './FileManagerPropertiesSheet';
import { FileManagerRenameSheet } from './FileManagerRenameSheet';
import { FileManagerDeleteSheet } from './FileManagerDeleteSheet';
import { copyEntryTo, moveEntryTo, renameEntryTo, shareEntry, deleteEntryWithConfirmation } from '../FileManagerActions';
import type { FileManagerEntry as Entry } from '../FileManagerTypes';
import { buildAssistantFileContext, formatFileContextForAssistant } from '@/features/nexus-assistant/fileContext';
import { setActiveFileContext } from '@/features/nexus-assistant/fileAssistantStore';

export function FileManagerActionHost({
  refresh,
  onEncrypt,
  onOpen,
  onAskAboutFile,
}: {
  refresh: () => Promise<void>;
  onEncrypt: (entry: Entry) => void;
  onOpen?: (entry: Entry) => void;
  onAskAboutFile?: (entry: Entry) => void;
}) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [sheet, setSheet] = useState<'actions' | 'properties' | 'rename' | 'delete' | null>(null);

  const close = () => setSheet(null);
  const open = (next: typeof sheet, target: Entry) => {
    setEntry(target);
    setSheet(next);
  };

  const handleAction = async (action: FileManagerSelectionAction, target: Entry) => {
    if (action === 'properties') return open('properties', target);
    if (action === 'rename') return open('rename', target);
    if (action === 'delete') return open('delete', target);
    if (action === 'encrypt') {
      close();
      return onEncrypt(target);
    }
    if (action === 'open') {
      close();
      return onOpen?.(target);
    }
    if (action === 'ask-about-file') {
      close();
      try {
        const context = await buildAssistantFileContext({
          uri: target.uri,
          name: target.name,
          format: target.extension.replace(/^\./, '').toLowerCase() as 'pdf' | 'epub' | 'txt' | 'md' | 'html' | 'rtf' | 'docx' | 'doc' | 'odt' | 'unsupported',
          sizeBytes: target.size,
        });
        await setActiveFileContext({
          ...context,
          promptContext: formatFileContextForAssistant(context),
        });
        onAskAboutFile?.(target);
      } catch (error) {
        Alert.alert('Unable to read file', error instanceof Error ? error.message : String(error));
      }
      return;
    }
    if (action === 'share') {
      try {
        await shareEntry(target);
        close();
      } catch (error) {
        Alert.alert('Share failed', error instanceof Error ? error.message : String(error));
      }
      return;
    }
    if (action === 'copy' || action === 'move') {
      Alert.alert(
        action === 'copy' ? 'Copy file' : 'Move file',
        'Choose the destination from the destination picker in the next file-operation stage.',
      );
      return;
    }
    if (action === 'compress') {
      Alert.alert('Compress', 'Archive creation is reserved for the archive-operation stage.');
    }
  };

  return (
    <>
      <FileManagerActionSheet
        entry={entry}
        visible={sheet === 'actions'}
        onClose={close}
        onAction={handleAction}
      />
      <FileManagerPropertiesSheet entry={entry} visible={sheet === 'properties'} onClose={close} />
      <FileManagerRenameSheet
        entry={entry}
        visible={sheet === 'rename'}
        onClose={close}
        onRename={async (target, name) => {
          await renameEntryTo(target, name);
          await refresh();
          close();
        }}
      />
      <FileManagerDeleteSheet
        entry={entry}
        visible={sheet === 'delete'}
        onClose={close}
        onDelete={async (target) => {
          await deleteEntryWithConfirmation(target);
          await refresh();
          close();
        }}
      />
    </>
  );
}
