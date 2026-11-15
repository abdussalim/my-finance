import React from "react";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center my-6 glass-surface rounded-3xl border border-slate-200/50">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-200/60 shadow-sm">
        {icon}
      </div>
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
