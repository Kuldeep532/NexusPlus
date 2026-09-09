import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nexus-plus.onboarding.v1';
const CCTV_POLICY_KEY = 'nexus-plus.cctv-policy.v1';

export async function hasCompletedWelcome(): Promise<boolean> {
  return (await AsyncStorage.getItem(STORAGE_KEY)) === 'completed';
}

export async function completeWelcome(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, 'completed');
}

export async function hasAcceptedCctvPolicy(): Promise<boolean> {
  return (await AsyncStorage.getItem(CCTV_POLICY_KEY)) === 'accepted';
}

export async function acceptCctvPolicy(): Promise<void> {
  await AsyncStorage.setItem(CCTV_POLICY_KEY, 'accepted');
}

export async function resetCctvPolicyAcceptance(): Promise<void> {
  await AsyncStorage.removeItem(CCTV_POLICY_KEY);
}

export { STORAGE_KEY as ONBOARDING_STORAGE_KEY, CCTV_POLICY_KEY as CCTV_POLICY_STORAGE_KEY };
