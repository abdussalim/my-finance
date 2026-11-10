import React from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-between max-w-md mx-auto relative shadow-sm">
      <main className="flex-1 pb-24 pt-safe px-4">{children}</main>
      <BottomNav />
    </div>
  );
}
