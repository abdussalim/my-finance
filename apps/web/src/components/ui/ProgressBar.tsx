import { cn } from "../../lib/cn";

export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  className?: string;
  height?: "sm" | "md" | "lg";
}

export function ProgressBar({
  progress,
  color = "#007AFF",
  className,
  height = "md",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5",
  };

  return (
    <div
      className={cn(
        "w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/40",
        heightClasses[height],
        className
      )}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out shadow-sm"
        style={{
          width: `${clamped}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
