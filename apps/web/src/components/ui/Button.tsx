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
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-120 press-scale disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090E] focus-visible:outline-none";

  const variants = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] border border-indigo-400/30",
    secondary:
      "bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.12] text-indigo-300 border border-white/[0.1] shadow-xs",
    outline:
      "bg-transparent hover:bg-white/[0.05] active:bg-white/[0.08] text-slate-300 border border-white/15 shadow-xs",
    danger:
      "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.35)] border border-rose-400/30",
    ghost:
      "bg-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]",
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
