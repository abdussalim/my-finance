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
  color = "#007AFF",
  className,
  height = "md",
  ariaLabel = "Kemajuan",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5",
  };

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full bg-slate-100/80 rounded-full overflow-hidden p-0.5 border border-slate-200/40",
        heightClasses[height],
        className
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out shadow-xs"
        style={{
          width: `${clamped}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
