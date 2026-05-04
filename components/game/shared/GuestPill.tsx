"use client";

interface GuestPillProps {
  message?: string;
  className?: string;
}

export default function GuestPill({
  message = "Sign in to save scores",
  className = "",
}: GuestPillProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-game-body
        bg-lanify-accent/5 border border-lanify-accent/15 text-lanify-text-secondary ${className}`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-lanify-accent/40" />
      {message}
    </div>
  );
}
