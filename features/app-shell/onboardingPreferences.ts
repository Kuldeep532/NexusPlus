import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nexus-plus.onboarding.v1';

export async function hasCompletedWelcome(): Promise<boolean> {
  return (await AsyncStorage.getItem(STORAGE_KEY)) === 'completed';
}

export async function completeWelcome(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, 'completed');
}

export { STORAGE_KEY as ONBOARDING_STORAGE_KEY };
