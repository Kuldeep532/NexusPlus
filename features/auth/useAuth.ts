import { useCallback, useEffect, useState } from 'react';
import type { AuthSession, EmailPasswordInput } from './authTypes';
import { nativeCurrentSession, nativeEmailRegister, nativeEmailSignIn, nativeGoogleSignIn, nativeSignOut } from './authNative';

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    nativeCurrentSession()
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

  const google = useCallback(() => run(nativeGoogleSignIn), [run]);
  const emailSignIn = useCallback((email: string, password: string) => run(() => nativeEmailSignIn(email, password)), [run]);
  const register = useCallback((input: EmailPasswordInput) => run(() => nativeEmailRegister(input)), [run]);

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      await nativeSignOut();
      setSession(null);
    } finally {
      setBusy(false);
    }
  }, []);

  return { session, loading, busy, error, google, emailSignIn, register, signOut };
}
