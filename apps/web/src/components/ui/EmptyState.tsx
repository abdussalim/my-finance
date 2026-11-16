import React from "react";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center my-4 bg-[#12141D] rounded-2xl border border-white/[0.07]">
      <div
        className="w-11 h-11 rounded-xl bg-[#1A1D2B] border border-white/[0.06] flex items-center justify-center text-indigo-400 mb-3"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-white tracking-tight">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
