import React from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#000000] text-[#FFFFFF] flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-white/[0.04] overflow-x-hidden">
      <main id="main-content" className="flex-1 pb-24 pt-safe px-4 sm:px-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
