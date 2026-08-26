import { useCallback, useEffect, useState } from 'react';
import type { AuthSession, EmailPasswordInput } from './authTypes';
import { nativeGoogleSignIn } from './authNative';
import {
  getStoredAuthSession,
  supabaseAuthAdapter,
  validateEmailPasswordInput,
} from './supabaseAuthAdapter';

function normalizeSession(value: any, provider: 'google' | 'password'): AuthSession {
  return {
    user: {
      uid: value.user.uid,
      email: value.user.email,
      displayName: value.user.displayName ?? '',
      photoUrl: value.user.photoUrl ?? null,
      provider,
    },
    idToken: value.idToken,
    expiresAt: value.expiresAt ?? null,
  };
}

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStoredAuthSession()
      .then((value) => {
        if (!cancelled) setSession(value);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not restore sign-in state.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const run = useCallback(async (action: () => Promise<AuthSession>) => {
    setError(null);
    setBusy(true);
    try {
      const next = await action();
      setSession(next);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setError(message);
      throw err;
    } finally {
      setBusy(false);
    }
  }, []);

  const google = useCallback(() => run(async () => {
    const credential = await nativeGoogleSignIn();
    const value = await supabaseAuthAdapter.signInWithGoogleIdToken(credential.idToken) as any;
    return normalizeSession(value, 'google');
  }), [run]);

  const emailSignIn = useCallback((email: string, password: string) => run(async () => {
    const value = await supabaseAuthAdapter.signInWithEmailPassword(email, password) as any;
    return normalizeSession(value, 'password');
  }), [run]);

  const register = useCallback((input: EmailPasswordInput) => run(async () => {
    validateEmailPasswordInput(input);
    const value = await supabaseAuthAdapter.registerWithEmailPassword(input) as any;
    return normalizeSession(value, 'password');
  }), [run]);

  const signOut = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await supabaseAuthAdapter.signOut();
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out.');
    } finally {
      setBusy(false);
    }
  }, []);

  return { session, loading, busy, error, google, emailSignIn, register, signOut };
}
