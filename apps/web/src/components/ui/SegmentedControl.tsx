import { cn } from "../../lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "flex p-1 bg-gray-200/70 rounded-xl relative",
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
              "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer",
              active
                ? "bg-white text-[#1D1D1F] shadow-sm scale-[0.99]"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
