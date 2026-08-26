export type FileManagerTab = 'browse' | 'categories' | 'recent' | 'secure';

export type FileManagerViewMode = 'list' | 'grid';

export type FileSortMode = 'name-asc' | 'name-desc' | 'size-asc' | 'size-desc' | 'date-new' | 'date-old' | 'type';

export type FileManagerLocation = {
  id: string;
  title: string;
  uri: string;
  kind: 'device' | 'folder' | 'recent' | 'secure';
};

export type FileManagerEntry = {
  id: string;
  uri: string;
  name: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: number;
  extension: string;
};

export type FileManagerSelectionAction =
  | 'open'
  | 'share'
  | 'rename'
  | 'delete'
  | 'move'
  | 'copy'
  | 'compress'
  | 'encrypt'
  | 'properties';
