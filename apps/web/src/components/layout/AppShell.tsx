import React from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#08090E] text-[#F8FAFC] flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-white/[0.06] overflow-x-hidden">
      {/* Immersive ambient luminous aura */}
      <div 
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-96 overflow-hidden z-0" 
        aria-hidden="true"
      >
        <div className="absolute -top-24 -left-20 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-12 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <main id="main-content" className="flex-1 pb-24 pt-safe px-4 sm:px-5 relative z-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
