export const NEXUS_ASSISTANT_CLOUD_CONFIG = {
  openAiSecretNames: ['OPENAI_API_KEY', 'OPENAI_KEY'],
  openAiModelEnvNames: ['OPENAI_MODEL'],
  gatewayRequiredSecretNames: ['CF_API_TOKEN', 'CLOUDFLARE_API_TOKEN'],
  gatewayUrlEnvNames: ['NEXUS_GATEWAY_URL', 'CLOUDFLARE_AI_GATEWAY_URL'],
  webSearchEnabled: true,
  providerOrder: ['openai', 'gemini'] as const,
} as const;

/**
 * These names describe the Worker-side configuration expected by the gateway.
 * Secret values must never be placed in the Android bundle or committed to git.
 */
