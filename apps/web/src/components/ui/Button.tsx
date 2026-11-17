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
    "inline-flex items-center justify-center font-semibold rounded-[14px] transition-all duration-120 ios-press disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]";

  const variants = {
    primary:
      "bg-[#0A84FF] text-white hover:bg-[#0071E3] active:bg-[#0058B3]",
    secondary:
      "bg-[rgba(118,118,128,0.24)] text-[#0A84FF] hover:bg-[rgba(118,118,128,0.36)] active:bg-[rgba(118,118,128,0.48)] border border-white/[0.04]",
    outline:
      "bg-transparent hover:bg-white/[0.06] text-[#0A84FF] border border-white/[0.16]",
    danger:
      "bg-[#FF453A] text-white hover:bg-[#D70015] active:bg-[#B30006]",
    ghost:
      "bg-transparent text-[#0A84FF] hover:bg-white/[0.06] active:bg-white/[0.1]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-[10px] min-h-[34px]",
    md: "px-4 py-2 text-sm rounded-[14px] min-h-[42px]",
    lg: "w-full py-3 text-base rounded-[16px] min-h-[48px]",
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
