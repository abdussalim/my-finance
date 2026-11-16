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
        "flex p-1 bg-[#12141D] rounded-xl border border-white/[0.07] select-none",
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
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg transition-colors duration-150 cursor-pointer press-scale focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none",
              size === "sm" ? "py-1.5 text-xs font-medium" : "py-2 text-xs font-medium",
              active
                ? "bg-indigo-600 text-white font-semibold shadow-xs"
                : "text-slate-400 hover:text-slate-200"
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
