export type AuthFailureCode =
  | 'DEVICE_INTEGRITY_FAILED'
  | 'UNVERIFIED_INSTALL'
  | 'DEVICE_ALREADY_LINKED'
  | 'ACCOUNT_ALREADY_LINKED'
  | 'ACCOUNT_BLOCKED'
  | 'DELETION_COOLDOWN'
  | 'SUPABASE_NOT_CONFIGURED'
  | 'AUTH_CANCELLED'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_NETWORK'
  | 'AUTH_UNKNOWN';

const MESSAGES: Record<AuthFailureCode, string> = {
  DEVICE_INTEGRITY_FAILED: 'This device could not pass the security check. Please use a certified, secure device.',
  UNVERIFIED_INSTALL: 'This installation could not be verified. Please uninstall this app and install it again from Google Play.',
  DEVICE_ALREADY_LINKED: 'This phone is already linked to another account. You cannot sign in with a second account on this device.',
  ACCOUNT_ALREADY_LINKED: 'This account is already linked to another phone. Please use the original device.',
  ACCOUNT_BLOCKED: 'This account or device has been blocked for security reasons. Please contact support if you believe this is a mistake.',
  DELETION_COOLDOWN: 'This account is still in its security deletion period. Please wait until the deletion period ends before using another account.',
  SUPABASE_NOT_CONFIGURED: 'Secure account verification is temporarily unavailable. Please try again later.',
  AUTH_CANCELLED: 'Sign-in was cancelled. Please try again when you are ready.',
  AUTH_INVALID_CREDENTIALS: 'The email or password is incorrect. Please check your details and try again.',
  AUTH_NETWORK: 'We could not reach the secure sign-in service. Check your internet connection and try again.',
  AUTH_UNKNOWN: 'We could not complete sign-in securely. Please try again.',
};

export function getAuthFailureMessage(code: AuthFailureCode): string {
  return MESSAGES[code];
}
