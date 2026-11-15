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
        "flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 select-none",
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
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg transition-colors duration-120 cursor-pointer press-scale focus-visible:ring-2 focus-visible:ring-[#4338CA] focus-visible:outline-none",
              size === "sm" ? "py-1.5 text-xs font-semibold" : "py-2 text-xs font-semibold",
              active
                ? "bg-white text-[#1E1B4B] font-bold shadow-2xs border border-slate-200/90"
                : "text-slate-600 hover:text-slate-900"
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
