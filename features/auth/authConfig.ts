export const APP_API_BASE_URL = process.env.EXPO_PUBLIC_NEXUS_API_BASE_URL?.replace(/\/$/, '') ?? '';

export function assertAppApiConfigured(): void {
  if (!APP_API_BASE_URL) throw new Error('API_SERVICE_NOT_CONFIGURED');
}

export const SUPABASE_GOOGLE_REDIRECT_URI = 'nexus-plus://auth/callback';
export const AUTH_PROFILE_SCHEMA_VERSION = 1 as const;
