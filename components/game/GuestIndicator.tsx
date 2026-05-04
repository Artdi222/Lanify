"use client";
import GuestPill from "@/components/game/shared/GuestPill";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function GuestIndicator() {
  const { isGuest } = useAuthStore();
  if (!isGuest) return null;
  return (
    <div className="fixed top-28 left-6 z-30 pointer-events-none">
      <GuestPill message="Guest play · score not saving" />
    </div>
  );
}
