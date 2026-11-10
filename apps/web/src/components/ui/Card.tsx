import React from "react";
import { cn } from "../../lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-5 border border-black/[0.03] apple-card-shadow transition-all active:scale-[0.99]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
