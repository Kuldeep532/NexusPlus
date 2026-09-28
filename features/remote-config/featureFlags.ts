import { getServerFeatureAccess } from '@/features/api-gateway/apiGatewayClient';
import { PREMIUM_FEATURES_ENABLED } from '@/features/premium/premiumAvailability';

export type NexusFeatureCode='nexus_discover'|'nexus_assist'|'audio_editor'|'voice_studio'|'pdf_tools'|'secure_vault'|'cctv'|'file_transfer';
export type NexusFeatureFlag={feature_code:NexusFeatureCode;feature_name:string;enabled:boolean;min_tier:1|2|3;message_when_disabled:string|null};

export async function refreshNexusFeatureFlags():Promise<NexusFeatureFlag[]> {
  return [];
}

export async function getNexusFeatureAccess(featureCode:NexusFeatureCode):Promise<{enabled:boolean;message?:string}> {
  if (!PREMIUM_FEATURES_ENABLED) {
    return { enabled: false, message: 'This feature is temporarily unavailable.' };
  }
  return getServerFeatureAccess(featureCode);
}

export function clearNexusFeatureFlagCache():void {}
