import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

function setAuthCookie(token: string | null) {
  if (typeof document === 'undefined') return;
  if (token) {
    document.cookie = `lanify-auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    document.cookie = 'lanify-auth-token=; path=/; max-age=0';
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isGuest: true,

      login: (token, user) => {
        setAuthCookie(token);
        set({ token, user, isGuest: false });
      },
      logout: () => {
        setAuthCookie(null);
        set({ token: null, user: null, isGuest: true });
      },
    }),
    {
      name: 'lanify-auth',
    }
  )
);
