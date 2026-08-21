export type ProfileModel = {
  displayName: string;
  email?: string;
  avatarUri?: string;
  readerStats: {
    documentsOpened: number;
    readingMinutes: number;
    bookmarks: number;
  };
};

export const EMPTY_PROFILE: ProfileModel = {
  displayName: 'Nexus Plus User',
  readerStats: {
    documentsOpened: 0,
    readingMinutes: 0,
    bookmarks: 0,
  },
};
