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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isGuest: true,

      login: (token, user) => set({ token, user, isGuest: false }),
      logout: () => set({ token: null, user: null, isGuest: true }),
    }),
    {
      name: 'lanify-auth',
    }
  )
);
