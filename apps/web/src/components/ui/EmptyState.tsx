import React from "react";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center my-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
      <div
        className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mb-3 border border-slate-200"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
