import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Presence = "online" | "dnd" | "offline";

export const PRESENCE_OPTIONS: { value: Presence; label: string; dot: string }[] = [
  { value: "online", label: "Online", dot: "bg-lf-success" },
  { value: "dnd", label: "Do not disturb", dot: "bg-lf-danger" },
  { value: "offline", label: "Appear offline", dot: "bg-lf-text-dim" },
];

// Client-side only for now: the backend has no presence/chat yet.
export const usePresenceStore = create<{ status: Presence; setStatus: (s: Presence) => void }>()(
  persist((set) => ({ status: "online", setStatus: (status) => set({ status }) }), { name: "lanify-presence" }),
);
