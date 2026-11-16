import React from "react";
import { cn } from "../../lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "surface" | "alt" | "outline";
  interactive?: boolean;
}

export function Card({
  className,
  children,
  variant = "surface",
  interactive = false,
  ...props
}: CardProps) {
  const variantStyles = {
    surface:
      "bg-[#11141E]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
    alt: "bg-white/[0.03] border border-white/[0.06] shadow-sm",
    outline: "bg-transparent border border-white/10",
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-4 transition-all duration-150 text-[#F8FAFC]",
        variantStyles[variant],
        interactive &&
          "press-scale cursor-pointer hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
