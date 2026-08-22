import { supabaseSingle, supabaseTable } from '@/src/backend/supabase';

export interface AppContentRecord {
  feature_id: string;
  content_key: string;
  locale: string;
  value: unknown;
  enabled: boolean;
  updated_at: string;
}

export interface RemoteAgentRelease {
  platform: 'windows' | 'macos' | 'ubuntu';
  version: string;
  download_url: string;
  sha256?: string | null;
  release_notes?: string | null;
  enabled: boolean;
  published_at: string;
}

export async function getFeatureContent(featureId: string, locale = 'en'): Promise<AppContentRecord[]> {
  const encodedFeature = encodeURIComponent(featureId);
  const encodedLocale = encodeURIComponent(locale);
  return supabaseTable<AppContentRecord>(
    'app_content',
    `feature_id=eq.${encodedFeature}&locale=eq.${encodedLocale}&enabled=eq.true&select=feature_id,content_key,locale,value,enabled,updated_at`,
  );
}

export async function getRemoteAgentRelease(platform: RemoteAgentRelease['platform']): Promise<RemoteAgentRelease | null> {
  const encodedPlatform = encodeURIComponent(platform);
  return supabaseSingle<RemoteAgentRelease>(
    'remote_agent_releases',
    `platform=eq.${encodedPlatform}&enabled=eq.true&order=published_at.desc&limit=1&select=platform,version,download_url,sha256,release_notes,enabled,published_at`,
  );
}

export async function getHomeFeatureCatalog(locale = 'en'): Promise<AppContentRecord[]> {
  return getFeatureContent('home', locale);
}
