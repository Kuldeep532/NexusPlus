export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';

export const SUPABASE_GOOGLE_REDIRECT_URI = 'nexus-plus://auth/callback';

export const AUTH_PROFILE_SCHEMA_VERSION = 1 as const;
