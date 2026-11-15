import { cn } from "../../lib/cn";

export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  className?: string;
  height?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

export function ProgressBar({
  progress,
  color = "#2563EB",
  className,
  height = "md",
  ariaLabel = "Kemajuan",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200",
        heightClasses[height],
        className
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{
          width: `${clamped}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
