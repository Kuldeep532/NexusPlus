import type { AuthSession, AuthUserProfile, EmailPasswordInput } from './authTypes';

export interface SupabaseAuthAdapter {
  signInWithGoogleIdToken(idToken: string): Promise<unknown>;
  signInWithEmailPassword(email: string, password: string): Promise<unknown>;
  registerWithEmailPassword(input: EmailPasswordInput): Promise<unknown>;
  upsertProfile(profile: AuthUserProfile): Promise<unknown>;
  signOut(): Promise<void>;
}

export interface AuthRepository {
  signInWithGoogle(): Promise<AuthSession>;
  signInWithEmailPassword(email: string, password: string): Promise<AuthSession>;
  registerWithEmailPassword(input: EmailPasswordInput): Promise<AuthSession>;
  syncProfileToSupabase(session: AuthSession): Promise<void>;
  signOut(): Promise<void>;
}
