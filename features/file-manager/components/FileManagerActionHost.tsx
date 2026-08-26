import { Alert } from 'react-native';
import { useState } from 'react';
import type { FileManagerEntry, FileManagerSelectionAction } from '../FileManagerTypes';
import { FileManagerActionSheet } from './FileManagerActionSheet';
import { FileManagerPropertiesSheet } from './FileManagerPropertiesSheet';
import { FileManagerRenameSheet } from './FileManagerRenameSheet';
import { FileManagerDeleteSheet } from './FileManagerDeleteSheet';
import { copyEntryTo, moveEntryTo, renameEntryTo, shareEntry, deleteEntryWithConfirmation } from '../FileManagerActions';
import type { FileManagerEntry as Entry } from '../FileManagerTypes';

export function FileManagerActionHost({
  refresh,
  onEncrypt,
  onOpen,
}: {
  refresh: () => Promise<void>;
  onEncrypt: (entry: Entry) => void;
  onOpen?: (entry: Entry) => void;
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
