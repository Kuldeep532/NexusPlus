const FRIENDLY_MESSAGES: Record<string, string> = {
  SUPABASE_AUTH_NOT_CONFIGURED: 'Nexus Plus could not connect to your account service. Please try again after checking your internet connection.',
  AUTH_SESSION_NOT_CREATED: 'We could not complete your sign-in. Please try again.',
  ACCOUNT_CREATED_CHECK_EMAIL: 'Your account was created. Please check your email to verify it.',
  GOOGLE_SIGN_IN_CANCELLED: 'Sign-in was cancelled.',
  GOOGLE_SIGN_IN_STATE_MISMATCH: 'Sign-in could not be verified. Please try again.',
  GOOGLE_SIGN_IN_CODE_MISSING: 'Sign-in could not be completed. Please try again.',
  GATEWAY_PATH_MUST_BE_RELATIVE: 'That request could not be completed.',
};

export function getUserFriendlyMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  if (FRIENDLY_MESSAGES[raw]) return FRIENDLY_MESSAGES[raw];
  if (/^SUPABASE_AUTH_ERROR_/.test(raw)) return 'We could not complete your account request. Please try again.';
  if (/^GATEWAY_DISCOVERY_FAILED_/.test(raw)) return 'Nexus Plus could not reach the service right now. Please try again later.';
  if (/failed/i.test(raw) || /error/i.test(raw)) return fallback;
  return raw || fallback;
}
