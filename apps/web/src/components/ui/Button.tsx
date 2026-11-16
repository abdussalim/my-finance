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
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-120 press-scale disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0B10] focus-visible:outline-none";

  const variants = {
    primary:
      "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-sm",
    secondary:
      "bg-[#1C2030] hover:bg-[#23283D] active:bg-[#2A3048] text-indigo-300 border border-white/[0.08]",
    outline:
      "bg-transparent hover:bg-white/[0.05] active:bg-white/[0.08] text-slate-300 border border-white/[0.12]",
    danger:
      "bg-red-600 hover:bg-red-500 text-white shadow-sm",
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
