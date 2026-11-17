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
    surface: "bg-[#1C1C1E] border border-white/[0.06]",
    alt: "bg-[#2C2C2E] border border-white/[0.08]",
    outline: "bg-transparent border border-white/[0.12]",
  };

  return (
    <div
      className={cn(
        "rounded-[20px] p-4 text-[#FFFFFF] transition-all duration-120",
        variantStyles[variant],
        interactive && "ios-press cursor-pointer hover:border-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
