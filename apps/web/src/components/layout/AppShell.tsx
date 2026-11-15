import React from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#F6F8FA] flex flex-col justify-between max-w-md mx-auto relative shadow-[0_0_50px_rgba(0,0,0,0.02)]">
      <main className="flex-1 pb-28 pt-safe px-4 sm:px-5">{children}</main>
      <BottomNav />
    </div>
  );
}
