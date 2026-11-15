import React from "react";
import { cn } from "../../lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "glass";
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
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-150 press-scale disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none";

  const variants = {
    primary:
      "bg-gradient-to-b from-[#007AFF] to-[#0066E0] text-white shadow-[0_4px_16px_rgba(0,122,255,0.25)] hover:brightness-105 active:brightness-95",
    secondary:
      "bg-white/90 text-slate-800 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:bg-slate-50",
    glass:
      "glass-surface text-slate-800 border border-white/60 shadow-sm hover:bg-white/90",
    danger:
      "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[0_4px_16px_rgba(244,63,94,0.25)] hover:brightness-105",
    ghost:
      "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs rounded-xl min-h-[36px]",
    md: "px-4 py-2.5 text-sm min-h-[44px]",
    lg: "w-full py-3.5 text-base rounded-2xl min-h-[50px]",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
}
