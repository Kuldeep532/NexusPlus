import type {
  CctvAuthFieldDefinition,
  CctvAuthenticationProfile,
  CctvAuthenticationProfileId,
  CctvCamera,
} from './cctvTypes';

const NAME_USERNAME_PASSWORD: CctvAuthFieldDefinition[] = [
  { id: 'name', label: 'Name', required: true },
  { id: 'username', label: 'Username', required: true },
  { id: 'password', label: 'Password', required: true, secret: true },
];
const USERNAME_PASSWORD: CctvAuthFieldDefinition[] = [
  { id: 'username', label: 'Username', required: true },
  { id: 'password', label: 'Password', required: true, secret: true },
];
const PROFILE_BY_ID: Record<CctvAuthenticationProfileId, CctvAuthFieldDefinition[]> = {
  name_username_password: NAME_USERNAME_PASSWORD,
  username_password: USERNAME_PASSWORD,
  pin: [{ id: 'pin', label: 'PIN', required: true, secret: true }],
  token: [{ id: 'token', label: 'Access Token', required: true, secret: true }],
  passcode: [{ id: 'passcode', label: 'Passcode', required: true, secret: true }],
  custom: USERNAME_PASSWORD,
};

export function detectAuthenticationProfile(input: {
  manufacturer?: string;
  model?: string;
  protocol?: CctvCamera['protocol'];
  qrPayload?: string;
  source: 'qr' | 'serial' | 'manual' | 'protocol';
}): CctvAuthenticationProfile {
  const manufacturer = input.manufacturer?.trim().toLowerCase() ?? '';
  const model = input.model?.trim().toLowerCase() ?? '';
  const identity = `${manufacturer} ${model}`;
  let id: CctvAuthenticationProfileId = 'username_password';
  let confidence: CctvAuthenticationProfile['confidence'] = 'default';

  if (input.qrPayload) {
    try {
      const prefix = 'nexusplus://cctv/';
      if (!input.qrPayload.startsWith(prefix)) throw new Error('Unsupported QR payload.');
      const payload = JSON.parse(decodeURIComponent(input.qrPayload.slice(prefix.length))) as Record<string, unknown>;
      const auth = payload.authentication;
      if (auth && typeof auth === 'object') {
        const authValue = auth as Record<string, unknown>;
        if (typeof authValue.profile === 'string' && authValue.profile in PROFILE_BY_ID) {
          id = authValue.profile as CctvAuthenticationProfileId;
          confidence = 'verified';
        } else if (Array.isArray(authValue.fields)) {
          const fields = authValue.fields.filter((item): item is string => typeof item === 'string');
          const hasName = fields.includes('name');
          const hasUsername = fields.includes('username');
          const hasPassword = fields.includes('password');
          if (hasName && hasUsername && hasPassword) id = 'name_username_password';
          else if (hasUsername && hasPassword) id = 'username_password';
          confidence = 'detected';
        }
      }
    } catch {
      // Invalid camera QR data is handled by the CCTV payload validator.
    }
  }

  if (confidence === 'default' && identity.includes('cp plus')) {
    id = 'name_username_password';
    confidence = 'verified';
  } else if (confidence === 'default' && input.protocol === 'onvif') {
    id = 'username_password';
    confidence = 'detected';
  }

  return { id, fields: PROFILE_BY_ID[id].map((field) => ({ ...field })), source: input.source, confidence };
}

export function getAuthenticationFields(profile?: CctvAuthenticationProfile): CctvAuthFieldDefinition[] {
  return (profile?.fields ?? USERNAME_PASSWORD).map((field) => ({ ...field }));
}
