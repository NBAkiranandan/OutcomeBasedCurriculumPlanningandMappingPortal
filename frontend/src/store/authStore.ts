import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

// Increment this version whenever the JWT secret or token structure changes.
// Mismatched version wipes stale localStorage tokens automatically on next page load.
const AUTH_VERSION = '2';

export const useAuthStore = create<AuthState>((set) => {
  // Version-check: clear stale auth data if session version doesn't match
  const storedVersion = localStorage.getItem('obcpmp_version');
  if (storedVersion !== AUTH_VERSION) {
    localStorage.removeItem('obcpmp_user');
    localStorage.removeItem('obcpmp_access');
    localStorage.removeItem('obcpmp_refresh');
    localStorage.setItem('obcpmp_version', AUTH_VERSION);
  }

  // Try to load initial auth data from localStorage
  const savedUser = localStorage.getItem('obcpmp_user');
  const savedAccess = localStorage.getItem('obcpmp_access');
  const savedRefresh = localStorage.getItem('obcpmp_refresh');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    accessToken: savedAccess || null,
    refreshToken: savedRefresh || null,
    isAuthenticated: !!savedAccess,

    login: (user, accessToken, refreshToken) => {
      localStorage.setItem('obcpmp_version', AUTH_VERSION);
      localStorage.setItem('obcpmp_user', JSON.stringify(user));
      localStorage.setItem('obcpmp_access', accessToken);
      localStorage.setItem('obcpmp_refresh', refreshToken);
      set({ user, accessToken, refreshToken, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('obcpmp_user');
      localStorage.removeItem('obcpmp_access');
      localStorage.removeItem('obcpmp_refresh');
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    },

    setAccessToken: (token) => {
      localStorage.setItem('obcpmp_access', token);
      set({ accessToken: token });
    }
  };
});
