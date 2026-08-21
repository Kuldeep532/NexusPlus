import type { AuthUserProfile, EmailPasswordInput } from './authTypes';
import type { SupabaseAuthAdapter } from './authRepository';

/**
 * Supabase is intentionally not initialized with invented project credentials.
 * The app will use this adapter once the project's URL/anon key and auth
 * configuration are provided through the supported build configuration.
 */
export const unavailableSupabaseAuthAdapter: SupabaseAuthAdapter = {
  signInWithGoogleIdToken: async () => {
    throw new Error('Supabase authentication is not configured for this build.');
  },
  signInWithEmailPassword: async () => {
    throw new Error('Supabase authentication is not configured for this build.');
  },
  registerWithEmailPassword: async () => {
    throw new Error('Supabase authentication is not configured for this build.');
  },
  upsertProfile: async (_profile: AuthUserProfile) => {
    throw new Error('Supabase profile sync is not configured for this build.');
  },
  signOut: async () => undefined,
};

export function validateEmailPasswordInput(input: EmailPasswordInput): void {
  if (input.name.trim().length < 1 || input.name.trim().length > 80) {
    throw new Error('Name must be between 1 and 80 characters.');
  }
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) {
    throw new Error('Please enter a valid email address.');
  }
  if (input.password.length < 8) {
    throw new Error('Password must contain at least 8 characters.');
  }
}
