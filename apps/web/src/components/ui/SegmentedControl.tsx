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
        "flex p-0.5 bg-[rgba(118,118,128,0.24)] rounded-[9px] select-none border border-white/[0.04]",
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
              "flex-1 flex items-center justify-center gap-1.5 rounded-[7px] transition-all duration-150 cursor-pointer select-none focus-visible:outline-none",
              size === "sm" ? "py-1 px-2 text-xs" : "py-1.5 px-3 text-[13px]",
              active
                ? "bg-[#636366] text-white font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                : "text-[rgba(235,235,245,0.65)] hover:text-white font-medium"
            )}
          >
            {opt.icon}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
