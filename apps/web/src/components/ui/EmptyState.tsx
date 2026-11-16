import React from "react";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center my-4 bg-[#11141E]/70 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-lg">
      <div
        className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-indigo-400 mb-3 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h4 className="text-sm font-bold text-white tracking-tight">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
