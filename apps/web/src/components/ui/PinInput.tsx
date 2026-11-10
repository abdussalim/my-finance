import { useEffect, useRef } from "react";
import { cn } from "../../lib/cn";

export interface PinInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  disabled?: boolean;
}

export function PinInput({ value, onChange, length = 6, disabled = false }: PinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  return (
    <div className="flex flex-col items-center" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits.slice(0, length));
        }}
        disabled={disabled}
        className="opacity-0 absolute -z-10 w-0 h-0"
        autoFocus
      />
      <div className="flex gap-4 my-6">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <div
              key={i}
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-all duration-200",
                filled
                  ? "bg-[#007AFF] border-[#007AFF] scale-110"
                  : "bg-transparent border-gray-300"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
