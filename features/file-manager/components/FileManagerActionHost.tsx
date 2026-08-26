import { useState } from 'react';
import { Alert } from 'react-native';
import type { FileManagerEntry, FileManagerSelectionAction } from '../FileManagerTypes';
import { FileManagerActionSheet } from './FileManagerActionSheet';
import { FileManagerPropertiesSheet } from './FileManagerPropertiesSheet';
import { FileManagerRenameSheet } from './FileManagerRenameSheet';
import { FileManagerDeleteSheet } from './FileManagerDeleteSheet';
import { copyEntryTo, moveEntryTo, renameEntryTo, shareEntry } from '../FileManagerActions';
import type { FileManagerEntry as Entry } from '../FileManagerTypes';

export function FileManagerActionHost({ refresh, onEncrypt }: { refresh: () => Promise<void>; onEncrypt: (entry: Entry) => void }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [sheet, setSheet] = useState<'actions' | 'properties' | 'rename' | 'delete' | null>(null);

  const close = () => setSheet(null);
  const open = (next: typeof sheet, target: Entry) => { setEntry(target); setSheet(next); };

  const handleAction = async (action: FileManagerSelectionAction, target: Entry) => {
    close();
    if (action === 'properties') return open('properties', target);
    if (action === 'rename') return open('rename', target);
    if (action === 'delete') return open('delete', target);
    if (action === 'encrypt') return onEncrypt(target);
    if (action === 'share') {
      try { await shareEntry(target); } catch (error) { Alert.alert('Share failed', error instanceof Error ? error.message : String(error)); }
      return;
    }
    if (action === 'open') return;
    if (action === 'copy' || action === 'move') {
      Alert.alert(action === 'copy' ? 'Copy' : 'Move', 'Destination picking is handled by the destination picker in the next file-operation stage.');
      return;
    }
    if (action === 'compress') {
      Alert.alert('Compress', 'Archive creation is queued for the archive operation stage.');
    }
  };

  return <>
    <FileManagerActionSheet entry={entry} visible={sheet === 'actions'} onClose={close} onAction={handleAction} />
    <FileManagerPropertiesSheet entry={entry} visible={sheet === 'properties'} onClose={close} />
    <FileManagerRenameSheet entry={entry} visible={sheet === 'rename'} onClose={close} onRename={async (target, name) => { await renameEntryTo(target, name); await refresh(); }} />
    <FileManagerDeleteSheet entry={entry} visible={sheet === 'delete'} onClose={close} onDelete={async (target) => { await (await import('../FileManagerActions')).deleteEntryWithConfirmation(target); await refresh(); }} />
  </>;
}

export type FileManagerActionHostTarget = { entry: Entry; openActions: () => void };
