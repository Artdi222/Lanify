import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminUser } from "@/types/user";

interface AdminState {
  token: string | null;
  user: AdminUser | null;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "lanify-admin-auth",
    }
  )
);
