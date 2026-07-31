"use client";

import { Lock } from "lucide-react";

export default function GuestLeaderboardPlaceholder() {
  const handleOpenAuth = () => {
    window.dispatchEvent(new CustomEvent("open-auth-dropdown"));
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className="w-12 h-12 rounded-full bg-lanify-surface border border-white/10 flex items-center justify-center">
        <Lock className="w-5 h-5 text-lanify-text-secondary/50" />
      </div>
      <p className="text-sm font-game-body text-lanify-text-secondary text-center">
        Login to see rankings
      </p>
      <button
        onClick={handleOpenAuth}
        className="px-4 py-2 rounded-lg bg-lanify-accent/10 border border-lanify-accent/20 text-lanify-accent text-xs font-game-body
          hover:bg-lanify-accent/15 transition-all duration-200 cursor-pointer"
      >
        Sign In
      </button>
    </div>
  );
}
