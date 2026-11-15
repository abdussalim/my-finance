import React from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#F6F8FA] flex flex-col justify-between max-w-md mx-auto relative shadow-[0_0_50px_rgba(0,0,0,0.02)] overflow-x-hidden">
      {/* Soft-Glass Ambient Backdrop Lighting Orbs (Non-interactive) */}
      <div
        aria-hidden="true"
        className="fixed top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/15 to-indigo-400/10 blur-3xl pointer-events-none -z-10"
      />
      <div
        aria-hidden="true"
        className="fixed top-1/3 left-0 -ml-28 w-80 h-80 rounded-full bg-gradient-to-tr from-emerald-400/12 to-teal-400/8 blur-3xl pointer-events-none -z-10"
      />
      <div
        aria-hidden="true"
        className="fixed bottom-12 right-0 -mr-24 w-72 h-72 rounded-full bg-gradient-to-tl from-amber-300/10 to-rose-300/8 blur-3xl pointer-events-none -z-10"
      />

      <main id="main-content" className="flex-1 pb-28 pt-safe px-4 sm:px-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
