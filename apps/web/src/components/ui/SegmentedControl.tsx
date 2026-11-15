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
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "flex p-1 bg-slate-200/60 rounded-2xl relative select-none",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 font-semibold rounded-xl transition-all duration-200 cursor-pointer press-scale",
              size === "sm" ? "py-1.5 text-xs" : "py-2 text-xs",
              active
                ? "bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
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
