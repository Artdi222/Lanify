"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { apiClient } from "@/lib/api/client";
import type { User } from "@/types/user";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const body = isRegister ? { username, email, password } : { email, password };
      const res = await apiClient<{ token: string; user: User }>(endpoint, { method: "POST", body });
      login(res.token, res.user);
      toast.success(isRegister ? "Account created!" : "Welcome back!");
      router.push(redirect);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <span className="text-3xl font-game-display font-bold text-lanify-accent glow-cyan">
          lanify
        </span>
        <p className="text-xs font-game-mono text-lanify-text-secondary mt-2 tracking-wider uppercase">
          {isRegister ? "Create Account" : "Sign In"}
        </p>
      </div>

      <div className="bg-lanify-surface/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs font-game-mono text-lanify-text-secondary uppercase tracking-wider mb-1.5 block">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="w-full px-4 py-3 rounded-xl bg-lanify-bg/50 border border-white/5 text-white text-sm font-game-body
                  placeholder:text-lanify-text-secondary/40 focus:outline-none focus:border-lanify-accent/30 transition-colors"
                placeholder="your_username"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-game-mono text-lanify-text-secondary uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-lanify-bg/50 border border-white/5 text-white text-sm font-game-body
                placeholder:text-lanify-text-secondary/40 focus:outline-none focus:border-lanify-accent/30 transition-colors"
              placeholder="player@lanify.gg"
            />
          </div>

          <div>
            <label className="text-xs font-game-mono text-lanify-text-secondary uppercase tracking-wider mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isRegister ? 8 : 1}
                className="w-full px-4 py-3 pr-11 rounded-xl bg-lanify-bg/50 border border-white/5 text-white text-sm font-game-body
                  placeholder:text-lanify-text-secondary/40 focus:outline-none focus:border-lanify-accent/30 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lanify-text-secondary hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-lanify-accent text-lanify-bg font-game-display font-semibold
              hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all duration-200 cursor-pointer disabled:opacity-50"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-lanify-bg border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {isRegister ? "Create Account" : "Sign In"}
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-game-body text-lanify-text-secondary hover:text-lanify-accent transition-colors cursor-pointer"
          >
            {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
          </button>
        </div>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => router.push("/")}
          className="text-xs font-game-body text-lanify-text-secondary/50 hover:text-lanify-text-secondary transition-colors cursor-pointer"
        >
          ← Back to game
        </button>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-lanify-bg" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-lanify-accent/3 blur-[200px]" />
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <Suspense fallback={<div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-lanify-accent border-t-transparent rounded-full animate-spin" /></div>}>
            <LoginForm />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
