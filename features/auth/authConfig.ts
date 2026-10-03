export const APP_API_BASE_URL = process.env.EXPO_PUBLIC_NEXUS_API_BASE_URL?.replace(/\/$/, '') ?? '';

export function assertAppApiConfigured(): void {
  if (!APP_API_BASE_URL) throw new Error('API_SERVICE_NOT_CONFIGURED');
}

// Production Supabase project URL. Build-time environment configuration may override this value,
// but production builds always resolve to the HTTPS Supabase project rather than localhost.
export const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || 'https://cpbwiarqlvtlnwbkmpws.supabase.co').replace(/\/$/, '');

export const SUPABASE_GOOGLE_REDIRECT_URI = 'nexus-plus://auth/callback';
export const SUPABASE_PASSWORD_RESET_REDIRECT_URI = SUPABASE_GOOGLE_REDIRECT_URI;
export const AUTH_PROFILE_SCHEMA_VERSION = 1 as const;

export function assertSupabaseProductionUrl(): void {
  if (!/^https:\/\/cpbwiarqlvtlnwbkmpws\.supabase\.co$/.test(SUPABASE_URL)) {
    throw new Error('SUPABASE_AUTH_NOT_CONFIGURED');
  }
}
