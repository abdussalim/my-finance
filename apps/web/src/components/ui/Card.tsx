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
    glass: "glass-surface shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]",
    elevated: "glass-surface-elevated",
    flat: "bg-slate-100/80 border border-slate-200/50",
  };

  return (
    <div
      className={cn(
        "rounded-3xl p-5 transition-all duration-200",
        variantStyles[variant],
        interactive && "press-scale cursor-pointer active:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
