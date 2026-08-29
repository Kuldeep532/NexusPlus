import { useCallback, useEffect, useState } from 'react';
import type { AuthSession, EmailPasswordInput } from './authTypes';
import {
  getStoredAuthSession,
  supabaseAuthAdapter,
  validateEmailPasswordInput,
} from './supabaseAuthAdapter';

type AuthListener = () => void;

let sharedSession: AuthSession | null = null;
let sharedLoading = true;
let sharedInitialized = false;
let sharedInitialization: Promise<void> | null = null;
const listeners = new Set<AuthListener>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

async function initializeSharedAuth(): Promise<void> {
  if (sharedInitialized) return;
  if (sharedInitialization) return sharedInitialization;

  sharedInitialization = getStoredAuthSession()
    .then((value) => {
      sharedSession = value;
    })
    .catch(() => {
      sharedSession = null;
    })
    .finally(() => {
      sharedLoading = false;
      sharedInitialized = true;
      sharedInitialization = null;
      notify();
    });

  return sharedInitialization;
}

function subscribe(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setSharedSession(value: AuthSession | null): void {
  sharedSession = value;
  sharedLoading = false;
  sharedInitialized = true;
  notify();
}

function normalizeSession(value: any, provider: 'google' | 'password'): AuthSession {
  if (!value?.user?.uid || !value?.idToken) {
    throw new Error('AUTH_SESSION_NOT_CREATED');
  }

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
  const [session, setSession] = useState<AuthSession | null>(sharedSession);
  const [loading, setLoading] = useState(sharedLoading);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setSession(sharedSession);
      setLoading(sharedLoading);
    };
    const unsubscribe = subscribe(sync);
    void initializeSharedAuth();
    sync();
    return unsubscribe;
  }, []);

  const run = useCallback(async (action: () => Promise<AuthSession>) => {
    setError(null);
    setBusy(true);
    try {
      const next = await action();
      setSharedSession(next);
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
    const value = await supabaseAuthAdapter.signInWithGoogleWeb() as any;
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
      setSharedSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out.');
    } finally {
      setBusy(false);
    }
  }, []);

  return { session, loading, busy, error, google, emailSignIn, register, signOut };
}
