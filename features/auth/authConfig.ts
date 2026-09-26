export const APP_API_BASE_URL = process.env.EXPO_PUBLIC_NEXUS_API_BASE_URL?.replace(/\/$/, '') ?? '';

export function assertAppApiConfigured(): void {
  if (!APP_API_BASE_URL) throw new Error('API_SERVICE_NOT_CONFIGURED');
}

// Auth and Storage use the same Supabase project origin derived from the single
// build-time application endpoint while testing is Supabase-only.
export const SUPABASE_URL = APP_API_BASE_URL.replace(/\/functions(?:\/.*)?$/, '');

export const SUPABASE_GOOGLE_REDIRECT_URI = 'nexus-plus://auth/callback';
export const AUTH_PROFILE_SCHEMA_VERSION = 1 as const;
