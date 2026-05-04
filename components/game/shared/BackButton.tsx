"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
  label?: string;
}

export default function BackButton({ href, label = "Back" }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-1.5 px-4 py-2 rounded-full 
        bg-lanify-surface border border-lanify-accent/20 text-lanify-accent text-sm font-game-body font-medium
        hover:bg-lanify-accent/10 hover:border-lanify-accent/40 transition-all duration-200 cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </motion.button>
  );
}
