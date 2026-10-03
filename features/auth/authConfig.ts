export const APP_API_BASE_URL = process.env.EXPO_PUBLIC_NEXUS_API_BASE_URL?.replace(/\/$/, '') ?? '';

export function assertAppApiConfigured(): void {
  if (!APP_API_BASE_URL) throw new Error('API_SERVICE_NOT_CONFIGURED');
}

// Authentication is anchored to the real Supabase project, independently of
// the application API gateway URL used by other features.
export const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || 'https://cpbwiarqlvtlnwbkmpws.supabase.co').replace(/\/$/, '');

export const SUPABASE_GOOGLE_REDIRECT_URI = 'nexus-plus://auth/callback';
export const AUTH_PROFILE_SCHEMA_VERSION = 1 as const;
