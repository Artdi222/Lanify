import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  /** `stay` false = session only: gone when the browser closes. */
  login: (token: string, user: User, stay?: boolean) => void;
  logout: () => void;
}

function setAuthCookie(token: string | null, stay = true) {
  if (typeof document === 'undefined') return;
  if (token) {
    const maxAge = stay ? `; max-age=${60 * 60 * 24 * 7}` : '';
    document.cookie = `lanify-auth-token=${token}; path=/${maxAge}; SameSite=Lax`;
  } else {
    document.cookie = 'lanify-auth-token=; path=/; max-age=0';
  }
}

const KEY = 'lanify-auth';
// Where the session lives: sessionStorage when the user chose not to stay signed in, else localStorage.
let sessionOnly = typeof window !== 'undefined' && window.sessionStorage.getItem(KEY) !== null;

const authStorage: StateStorage = {
  getItem: (name) => window.sessionStorage.getItem(name) ?? window.localStorage.getItem(name),
  setItem: (name, value) => {
    const [to, other] = sessionOnly ? [window.sessionStorage, window.localStorage] : [window.localStorage, window.sessionStorage];
    other.removeItem(name);
    to.setItem(name, value);
  },
  removeItem: (name) => {
    window.sessionStorage.removeItem(name);
    window.localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isGuest: true,

      login: (token, user, stay = true) => {
        sessionOnly = !stay;
        setAuthCookie(token, stay);
        set({ token, user, isGuest: false });
      },
      logout: () => {
        setAuthCookie(null);
        set({ token: null, user: null, isGuest: true });
      },
    }),
    {
      name: KEY,
      storage: createJSONStorage(() => (typeof window === 'undefined' ? undefined : authStorage) as StateStorage),
    }
  )
);
