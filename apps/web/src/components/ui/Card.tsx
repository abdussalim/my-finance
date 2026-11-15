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
    surface: "bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)]",
    alt: "bg-slate-50 border border-slate-200/80 shadow-xs",
    outline: "bg-transparent border border-slate-200",
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-4 transition-colors duration-120",
        variantStyles[variant],
        interactive &&
          "press-scale cursor-pointer hover:border-indigo-300 focus-visible:ring-2 focus-visible:ring-[#4338CA] focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
