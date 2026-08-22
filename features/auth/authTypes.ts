export type AuthProvider = 'google' | 'password';

export interface AuthUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string | null;
  provider: AuthProvider;
}

export interface AuthSession {
  user: AuthUserProfile;
  idToken: string;
  expiresAt?: number | null;
}

export interface EmailPasswordInput {
  name: string;
  email: string;
  password: string;
}
