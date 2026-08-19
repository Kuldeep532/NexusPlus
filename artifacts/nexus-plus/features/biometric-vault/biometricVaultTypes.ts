export type VaultCategory =
  | 'PASSWORD'
  | 'SECURE_NOTE'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'IDENTITY_DOCUMENT'
  | 'BANK_ACCOUNT'
  | 'WIFI'
  | 'SECRET';

export interface VaultItemBase {
  id: string;
  category: VaultCategory;
  title: string;
  createdAt: number;
  updatedAt: number;
  favorite?: boolean;
  tags?: string[];
}

export interface PasswordVaultItem extends VaultItemBase {
  category: 'PASSWORD';
  username: string;
  password: string;
  website?: string;
  notes?: string;
}

export interface SecureNoteVaultItem extends VaultItemBase {
  category: 'SECURE_NOTE';
  content: string;
}

export interface DebitCardVaultItem extends VaultItemBase {
  category: 'DEBIT_CARD';
  cardHolder: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  pin?: string;
  bankName?: string;
  notes?: string;
}

export interface CreditCardVaultItem extends VaultItemBase {
  category: 'CREDIT_CARD';
  cardHolder: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  creditLimit?: string;
  bankName?: string;
  notes?: string;
}

export interface IdentityDocumentVaultItem extends VaultItemBase {
  category: 'IDENTITY_DOCUMENT';
  documentType: string;
  documentNumber: string;
  expiryDate?: string;
  issuingAuthority?: string;
  fileUri?: string;
  notes?: string;
}

export interface BankAccountVaultItem extends VaultItemBase {
  category: 'BANK_ACCOUNT';
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc?: string;
  branch?: string;
  accountType?: string;
  notes?: string;
}

export interface WifiVaultItem extends VaultItemBase {
  category: 'WIFI';
  networkName: string;
  password: string;
  securityType?: string;
  notes?: string;
}

export interface SecretVaultItem extends VaultItemBase {
  category: 'SECRET';
  secret: string;
  notes?: string;
}

export type VaultItem =
  | PasswordVaultItem
  | SecureNoteVaultItem
  | DebitCardVaultItem
  | CreditCardVaultItem
  | IdentityDocumentVaultItem
  | BankAccountVaultItem
  | WifiVaultItem
  | SecretVaultItem;

export interface VaultEnvelope {
  version: 1;
  algorithm: 'AES-256-GCM';
  keyVersion: number;
  createdAt: number;
  updatedAt: number;
  ciphertext: string;
  iv: string;
  tag: string;
  aad: string;
}

export interface VaultSecurityConfig {
  autoLockSeconds: number;
  lockOnBackground: boolean;
  requireBiometricOnOpen: boolean;
  requireBiometricForSensitiveReveal: boolean;
  clipboardClearSeconds: number;
}

export interface VaultState {
  isUnlocked: boolean;
  isReady: boolean;
  isLoading: boolean;
  items: VaultItem[];
  authError: string | null;
  lastUnlockedAt: number | null;
  sessionExpiresAt: number | null;
  security: VaultSecurityConfig;
}

export const DOCUMENT_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Passport',
  'Driving Licence',
  'Voter ID (EPIC)',
  'Ration Card',
  'Health Insurance Card',
  'Vehicle Registration (RC)',
  'Income Tax / ITR',
  'Birth Certificate',
  'Educational Certificate',
  'GST Certificate',
  'Other',
] as const;

export const VAULT_CATEGORY_META: Record<
  VaultCategory,
  { label: string; icon: string; description: string }
> = {
  PASSWORD: {
    label: 'Passwords',
    icon: 'key-outline',
    description: 'Website and app credentials',
  },
  SECURE_NOTE: {
    label: 'Secure Notes',
    icon: 'note-text-outline',
    description: 'Private encrypted notes',
  },
  DEBIT_CARD: {
    label: 'Debit Cards',
    icon: 'card-account-details-outline',
    description: 'Debit card information',
  },
  CREDIT_CARD: {
    label: 'Credit Cards',
    icon: 'credit-card-outline',
    description: 'Credit card information',
  },
  IDENTITY_DOCUMENT: {
    label: 'Identity Documents',
    icon: 'card-account-details-outline',
    description: 'Government and personal documents',
  },
  BANK_ACCOUNT: {
    label: 'Bank Accounts',
    icon: 'bank-outline',
    description: 'Account and branch details',
  },
  WIFI: {
    label: 'Wi-Fi',
    icon: 'wifi-lock',
    description: 'Private network credentials',
  },
  SECRET: {
    label: 'Other Secrets',
    icon: 'shield-key-outline',
    description: 'Anything else worth protecting',
  },
};

export const DEFAULT_VAULT_SECURITY: VaultSecurityConfig = {
  autoLockSeconds: 60,
  lockOnBackground: true,
  requireBiometricOnOpen: true,
  requireBiometricForSensitiveReveal: true,
  clipboardClearSeconds: 30,
};
