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
        "flex p-1 bg-slate-200/50 backdrop-blur-md rounded-2xl relative select-none border border-white/60",
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
              "flex-1 flex items-center justify-center gap-1.5 font-semibold rounded-xl transition-colors duration-150 cursor-pointer press-scale focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none",
              size === "sm" ? "py-1.5 text-xs" : "py-2 text-xs",
              active
                ? "bg-white/95 text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/80"
                : "text-slate-500 hover:text-slate-800"
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
