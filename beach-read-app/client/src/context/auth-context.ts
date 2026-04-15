import { createContext, useContext } from 'react';
import type { AuthContextUser } from '../lib/types';

export interface AuthContextType {
  user: AuthContextUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<AuthContextUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  clearError: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
