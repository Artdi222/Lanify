"use client";
import { useState } from "react";
import { X } from "lucide-react";

export default function GuestBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const handleOpenAuth = () => {
    window.dispatchEvent(new CustomEvent("open-auth-dropdown"));
  };

  return (
    <div className="relative flex items-center justify-between px-4 py-3 bg-lanify-accent/5 border border-lanify-accent/15 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-lanify-accent/50" />
        <span className="text-sm font-game-body text-lanify-text-secondary">
          You played as a guest — your score wasn&apos;t saved
        </span>
        <button
          onClick={handleOpenAuth}
          className="px-3 py-1 rounded-lg bg-lanify-accent text-lanify-bg text-xs font-game-body font-medium cursor-pointer hover:shadow-[0_0_12px_rgba(185,189,230,0.3)] transition-all duration-200"
        >
          Login to save future scores
        </button>
      </div>
      <button onClick={() => setDismissed(true)} className="p-1 cursor-pointer hover:text-white transition-colors">
        <X className="w-4 h-4 text-lanify-text-secondary" />
      </button>
    </div>
  );
}
