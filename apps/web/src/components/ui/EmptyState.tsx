import React from "react";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center my-4 bg-[#1C1C1E] rounded-[20px] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      <div
        className="w-12 h-12 rounded-[14px] bg-[rgba(118,118,128,0.24)] text-[#0A84FF] flex items-center justify-center mb-3"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h4 className="text-base font-semibold text-white tracking-tight">{title}</h4>
      <p className="text-xs text-[rgba(235,235,245,0.60)] mt-1 max-w-xs leading-relaxed">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
