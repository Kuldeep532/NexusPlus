import { loadLanguagePreferences } from './languagePreferences';

export async function getBookReaderLanguage() {
  const preferences = await loadLanguagePreferences();
  return preferences.bookReaderLanguage;
}
