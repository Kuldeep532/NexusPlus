const FRIENDLY_MESSAGES: Record<string, string> = {
  SUPABASE_AUTH_NOT_CONFIGURED: 'We could not connect to your account service. Please check your internet connection and try again.',
  AUTH_SESSION_NOT_CREATED: 'We could not complete your sign-in. Please try again.',
  ACCOUNT_CREATED_CHECK_EMAIL: 'Your account was created. Please check your email to verify it.',
  GOOGLE_SIGN_IN_CANCELLED: 'Sign-in was cancelled.',
  GOOGLE_SIGN_IN_STATE_MISMATCH: 'We could not verify your sign-in. Please try again.',
  GOOGLE_SIGN_IN_CODE_MISSING: 'We could not complete your sign-in. Please try again.',
  GATEWAY_PATH_MUST_BE_RELATIVE: 'We could not complete that request. Please try again.',
  AUTH_REQUIRED: 'Please sign in and try again.',
  VIDEO_MIME_TYPE_REQUIRED: 'Please choose a supported video file.',
  VIDEO_REQUIRED: 'Please choose a video first.',
  AUDIO_DESCRIPTION_EMPTY: 'No audio description was produced. Please try another video.',
  AUDIO_DESCRIPTION_FAILED: 'We could not create the audio description right now. Please try again.',
  GEMINI_NOT_CONFIGURED: 'The audio description service is temporarily unavailable. Please try again later.',
  PREMIUM_REQUIRED: 'Advanced audio description requires an active Premium plan.',
  INSUFFICIENT_CREDITS: 'You do not have enough AI credits for this request.',
  FREE_BASIC_QUOTA_EXCEEDED: 'Your free basic audio description limit has been reached for this month.',
  APP_VERIFICATION_REQUIRED: 'This app installation could not be verified. Please install the official Nexus Plus build and try again.',
  FEEDBACK_SUBMIT_FAILED: 'We could not send your feedback. Please try again.',
  FEEDBACK_SUBMIT_FAILED_5: 'We could not send your feedback right now. Please try again later.',
  STORE_NOT_AVAILABLE: 'The app store is not available on this device.',
};

export function getUserFriendlyMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const normalized = raw.trim();

  if (!normalized) return fallback;
  if (FRIENDLY_MESSAGES[normalized]) return FRIENDLY_MESSAGES[normalized];

  if (/^SUPABASE_AUTH_ERROR_/i.test(normalized)) {
    return 'We could not complete your account request. Please try again.';
  }
  if (/^GATEWAY_DISCOVERY_FAILED_/i.test(normalized)) {
    return 'We could not reach the service right now. Please try again later.';
  }
  if (/^SUPABASE_PREMIUM_REQUEST_5\d\d$/i.test(normalized)) {
    return 'The account service is temporarily unavailable. Please try again later.';
  }

  // Never expose raw technical diagnostics, stack traces, internal codes, URLs, or
  // infrastructure details in user-facing messages.
  if (
    /stack trace|referenceerror|typeerror|syntaxerror|exception|fatal|undefined is not|cannot read propert(?:y|ies)|cannot access|is not a function|node_modules|webpack|metro|gradle|kotlin|java\.lang|supabase|firebase|grpc|https?:\/\/|\b5\d\d\b|\b4\d\d\b|eas build|native module|jni|hermes/i.test(normalized)
    || normalized.includes('\n')
  ) {
    return fallback;
  }

  if (/failed|error|timeout|unavailable|invalid|denied|forbidden|unauthorized|cancelled|canceled/i.test(normalized)) {
    return fallback;
  }

  return normalized;
}
