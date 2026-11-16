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
    surface: "bg-[#12141D] border border-white/[0.07]",
    alt: "bg-[#181B26] border border-white/[0.05]",
    outline: "bg-transparent border border-white/[0.09]",
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-4 transition-colors duration-150 text-[#FFFFFF]",
        variantStyles[variant],
        interactive &&
          "surface-interactive cursor-pointer hover:border-white/[0.14] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
