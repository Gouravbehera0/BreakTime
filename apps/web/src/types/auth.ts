export interface UserProfile {
  id: string;
  displayName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AuthMethod = 'phone' | 'email';

export interface AuthSession {
  user: {
    id: string;
    email?: string;
    phone?: string;
  } | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoUser?: boolean;
}
