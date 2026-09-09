import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EPaperDocument } from './ePaperTypes';

const STORAGE_KEY = 'nexusplus.epaper.projects.v1';

type ProjectMap = Record<string, EPaperDocument>;

async function readProjects(): Promise<ProjectMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) as ProjectMap; } catch { return {}; }
}

export async function saveEPaperProject(doc: EPaperDocument): Promise<void> {
  const projects = await readProjects();
  const key = `${doc.title || 'My E-Paper'}-${doc.publisher || 'Publisher'}`;
  projects[key] = doc;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export async function listEPaperProjects(): Promise<EPaperDocument[]> {
  return Object.values(await readProjects());
}
