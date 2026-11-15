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
    "inline-flex items-center justify-center font-semibold rounded-xl transition-colors duration-120 press-scale disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-[#4338CA] focus-visible:ring-offset-2 focus-visible:outline-none";

  const variants = {
    primary:
      "bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white shadow-[0_2px_8px_-1px_rgba(67,56,202,0.25)] border border-transparent",
    secondary:
      "bg-indigo-50/70 hover:bg-indigo-100/80 text-[#312E81] border border-indigo-200/80 shadow-xs",
    outline:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs",
    danger:
      "bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-[0_2px_8px_-1px_rgba(225,29,72,0.25)] border border-transparent",
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
