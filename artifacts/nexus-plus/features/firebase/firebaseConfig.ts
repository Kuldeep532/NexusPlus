type FirebaseEnv = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

const read = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
};

export function getFirebaseEnv(): FirebaseEnv | null {
  const apiKey = read('EXPO_PUBLIC_FIREBASE_API_KEY', 'FIREBASE_API_KEY');
  const authDomain = read('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN');
  const projectId = read('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID');
  const storageBucket = read('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET');
  const messagingSenderId = read('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID');
  const appId = read('EXPO_PUBLIC_FIREBASE_APP_ID', 'FIREBASE_APP_ID');
  const measurementId = read('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID', 'FIREBASE_MEASUREMENT_ID');

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) return null;

  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId };
}

export const firebaseEnv = getFirebaseEnv();

export function assertFirebaseEnv(): FirebaseEnv {
  if (!firebaseEnv) {
    throw new Error(
      'Firebase configuration is missing. Define EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, EXPO_PUBLIC_FIREBASE_PROJECT_ID, EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID and EXPO_PUBLIC_FIREBASE_APP_ID.'
    );
  }
  return firebaseEnv;
}
