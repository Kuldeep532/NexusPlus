import { NativeModules, Platform } from 'react-native';
import type { AuthSession, AuthUserProfile } from './authTypes';

interface NativeAuthModule {
  signInWithGoogle(): Promise<{
    uid: string;
    email: string;
    displayName: string;
    photoUrl?: string | null;
    provider: 'google';
    idToken: string;
  }>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<{
    uid: string;
    email: string;
    displayName: string;
    photoUrl?: string | null;
    provider: 'google';
    idToken: string;
  } | null>;
}

function nativeAuth(): NativeAuthModule {
  if (Platform.OS !== 'android' || !NativeModules.NexusAuth) {
    throw new Error('Nexus native authentication is unavailable.');
  }
  return NativeModules.NexusAuth as NativeAuthModule;
}

function mapUser(value: Awaited<ReturnType<NativeAuthModule['signInWithGoogle']>>): AuthUserProfile {
  return {
    uid: value.uid,
    email: value.email,
    displayName: value.displayName,
    photoUrl: value.photoUrl ?? null,
    provider: value.provider,
  };
}

export async function signInWithGoogle(): Promise<AuthSession> {
  const result = await nativeAuth().signInWithGoogle();
  return {
    user: mapUser(result),
    idToken: result.idToken,
  };
}

export async function getCurrentAuthSession(): Promise<AuthSession | null> {
  const result = await nativeAuth().getCurrentUser();
  if (!result) return null;
  return {
    user: mapUser(result),
    idToken: result.idToken,
  };
}

export async function signOut(): Promise<void> {
  await nativeAuth().signOut();
}
