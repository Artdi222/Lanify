"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { apiClient } from "@/lib/api/client";
import type { User } from "@/types/user";
import { AUTH_BUTTON, AUTH_BUTTON_STYLE, AUTH_FIELD } from "./styles";

/** Guest sign-in panel under the top bar. Spec: docs/ui-spec/auth.md. */
export default function AccountPanel({ onDone, onRegister }: { onDone: () => void; onRegister: () => void }) {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient<{ token: string; user: User }>("/auth/login", { method: "POST", body: { email, password } });
      login(res.token, res.user);
      toast.success("Welcome back!");
      onDone();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-3.5 p-7 pt-6">
      <h2 className="font-game-display text-[17px] font-bold uppercase text-white">Account</h2>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email" autoComplete="email" className={AUTH_FIELD} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="password" autoComplete="current-password" className={AUTH_FIELD} />
      <div className="space-y-[7px] pt-3">
        <button type="submit" disabled={loading} className={AUTH_BUTTON} style={AUTH_BUTTON_STYLE}>
          {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Sign in"}
        </button>
        <button type="button" onClick={onRegister} className={AUTH_BUTTON} style={AUTH_BUTTON_STYLE}>
          Register
        </button>
      </div>
    </form>
  );
}
