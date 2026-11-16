import React from "react";
import { cn } from "../../lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
  ariaLabel = "Opsi filter",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex p-1 bg-white/[0.04] backdrop-blur-md rounded-xl border border-white/[0.08] select-none",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg transition-all duration-150 cursor-pointer press-scale focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none",
              size === "sm" ? "py-1.5 text-xs font-semibold" : "py-2 text-xs font-semibold",
              active
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.35)] border border-indigo-400/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
