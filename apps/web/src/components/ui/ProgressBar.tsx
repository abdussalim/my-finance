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
  color = "#6366F1",
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
        "w-full bg-white/[0.08] rounded-full overflow-hidden border border-white/[0.04]",
        heightClasses[height],
        className
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{
          width: `${clamped}%`,
          backgroundColor: color,
          boxShadow: `0 0 12px ${color}88`,
        }}
      />
    </div>
  );
}
