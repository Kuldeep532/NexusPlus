import { NativeModules, Platform } from 'react-native';
import type { AuthSession, EmailPasswordInput } from './authTypes';

type NativeUser = {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string | null;
  provider: string;
  idToken: string;
};

type NativeAuth = {
  signInWithGoogle(): Promise<NativeUser>;
  signInWithEmail(email: string, password: string): Promise<NativeUser>;
  registerWithEmail(name: string, email: string, password: string): Promise<NativeUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<NativeUser | null>;
};

function getNative(): NativeAuth {
  if (Platform.OS !== 'android' || !NativeModules.NexusAuth) {
    throw new Error('Native authentication is unavailable.');
  }
  return NativeModules.NexusAuth as NativeAuth;
}

function toSession(user: NativeUser): AuthSession {
  return {
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl ?? null,
      provider: user.provider === 'google' ? 'google' : 'password',
    },
    idToken: user.idToken,
  };
}

export async function nativeGoogleSignIn(): Promise<AuthSession> {
  return toSession(await getNative().signInWithGoogle());
}

export async function nativeEmailSignIn(email: string, password: string): Promise<AuthSession> {
  return toSession(await getNative().signInWithEmail(email, password));
}

export async function nativeEmailRegister(input: EmailPasswordInput): Promise<AuthSession> {
  return toSession(await getNative().registerWithEmail(input.name, input.email, input.password));
}

export function nativeSignOut(): Promise<void> {
  return getNative().signOut();
}

export async function nativeCurrentSession(): Promise<AuthSession | null> {
  const user = await getNative().getCurrentUser();
  return user ? toSession(user) : null;
}
