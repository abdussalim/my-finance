import { cn } from "../../lib/cn";

export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  className?: string;
}

export function ProgressBar({ progress, color = "#007AFF", className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <div className={cn("w-full bg-gray-100 rounded-full h-2 overflow-hidden", className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}
