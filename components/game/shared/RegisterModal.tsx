"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Lock, LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { apiClient } from "@/lib/api/client";
import type { User as UserType } from "@/types/user";
import { toast } from "sonner";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const { login } = useAuthStore();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient<{ token: string; user: UserType }>("/auth/register", {
        method: "POST",
        body: { username, email, password },
      });
      login(res.token, res.user);
      toast.success("Account created successfully!");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 w-full max-w-4xl bg-[#090e17] border border-blue-900/40 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 text-white/50 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column: Form */}
            <div className="p-8 sm:p-10 flex flex-col justify-center">
              <div className="mb-6">
                <span className="text-xs font-game-mono text-blue-400 uppercase tracking-widest block mb-1">
                  JOIN LANIFY
                </span>
                <h2 className="text-2xl font-game-display font-bold text-white">
                  Create Your Account
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-game-mono text-white/70 uppercase tracking-wider mb-1 block">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      minLength={3}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050911] border border-blue-900/50 text-white text-sm font-game-body
                        placeholder:text-white/30 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="PlayerOne"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-game-mono text-white/70 uppercase tracking-wider mb-1 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050911] border border-blue-900/50 text-white text-sm font-game-body
                        placeholder:text-white/30 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="player@lanify.gg"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-game-mono text-white/70 uppercase tracking-wider mb-1 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#050911] border border-blue-900/50 text-white text-sm font-game-body
                        placeholder:text-white/30 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-game-mono text-white/70 uppercase tracking-wider mb-1 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050911] border border-blue-900/50 text-white text-sm font-game-body
                        placeholder:text-white/30 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-game-display font-semibold
                    shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Create Account
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Animated tech background with non-spinning logo badge */}
            <div className="hidden md:flex relative flex-col items-center justify-center p-8 bg-linear-to-br from-[#050a15] via-[#0a152d] to-[#040710] border-l border-blue-900/40 overflow-hidden">
              {/* Dynamic flowing mesh grid */}
              <motion.div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
                  backgroundSize: "24px 24px"
                }}
                animate={{
                  backgroundPosition: ["0px 0px", "24px 24px"]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />

              {/* Pulsing ambient radial light gradients */}
              <motion.div
                className="absolute w-72 h-72 rounded-full bg-blue-500/25 blur-3xl pointer-events-none"
                animate={{
                  scale: [0.9, 1.25, 0.9],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute w-60 h-60 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none"
                animate={{
                  scale: [1.2, 0.85, 1.2],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                className="absolute w-64 h-64 rounded-full border border-blue-500/30 pointer-events-none"
                animate={{
                  scale: [0.8, 1.4, 0.8],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />

              <div className="relative z-10 flex flex-col items-center gap-4">
                <motion.div 
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-48 h-48 rounded-full bg-[#040b16] border-4 border-blue-500 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-shadow duration-300 hover:shadow-[0_0_80px_rgba(59,130,246,0.7)]"
                >
                  <span className="text-4xl font-game-display font-bold text-blue-100 tracking-[0.18em]">
                    LANIFY
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
