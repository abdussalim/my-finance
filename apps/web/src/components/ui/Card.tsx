import React from "react";
import { cn } from "../../lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "glass" | "elevated" | "flat";
  interactive?: boolean;
}

export function Card({
  className,
  children,
  variant = "glass",
  interactive = false,
  ...props
}: CardProps) {
  const variantStyles = {
    glass: "glass-surface",
    elevated: "glass-surface-elevated",
    flat: "bg-slate-100/70 border border-slate-200/50",
  };

  return (
    <div
      className={cn(
        "rounded-3xl p-5 transition-transform transition-shadow duration-150",
        variantStyles[variant],
        interactive &&
          "press-scale cursor-pointer active:shadow-sm focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
