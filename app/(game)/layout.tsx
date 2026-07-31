"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import GameNavbar from "@/components/game/shared/Navbar";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPlayPage = pathname.includes("/play/");
  const isResultPage = pathname.includes("/result");
  const hideNavbar = isPlayPage || isResultPage;

  return (
    <div className="h-full bg-lanify-bg text-lanify-text font-game-body flex flex-col overflow-hidden">
      {!hideNavbar && <GameNavbar />}
      
      <main className={`flex-1 flex flex-col min-h-0 relative ${!hideNavbar ? "mt-9" : ""}`}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
