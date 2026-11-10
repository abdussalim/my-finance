import React from "react";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center my-6">
      <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-[#1D1D1F]">{title}</h4>
      <p className="text-xs text-gray-500 mt-1 max-w-xs">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
