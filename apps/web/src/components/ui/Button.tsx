import React from "react";
import { cn } from "../../lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-colors duration-120 press-scale disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:outline-none";

  const variants = {
    primary:
      "bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs border border-transparent",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-xs",
    outline:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs",
    danger:
      "bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs border border-transparent",
    ghost:
      "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg min-h-[36px]",
    md: "px-4 py-2 text-sm rounded-xl min-h-[40px]",
    lg: "w-full py-2.5 text-sm sm:text-base rounded-xl min-h-[46px]",
  };

  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"
          role="status"
          aria-label="Memuat…"
        />
      ) : null}
      {children}
    </button>
  );
}
