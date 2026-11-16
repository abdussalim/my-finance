import { useEffect, useRef } from "react";
import { cn } from "../../lib/cn";
import { Delete } from "lucide-react";

export interface PinInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  disabled?: boolean;
  showKeypad?: boolean;
}

export function PinInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  showKeypad = true,
}: PinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showKeypad && !disabled) {
      inputRef.current?.focus();
    }
  }, [disabled, showKeypad]);

  const handleDigit = (digit: string) => {
    if (disabled || value.length >= length) return;
    onChange(value + digit);
  };

  const handleDelete = () => {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xs mx-auto select-none">
      {/* Hidden input for physical keyboard support */}
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        aria-label="Masukkan 6-digit Master PIN"
        autoComplete="one-time-code"
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits.slice(0, length));
        }}
        disabled={disabled}
        className="opacity-0 absolute -z-10 w-0 h-0"
      />

      {/* 6 Passcode Indicators */}
      <div
        className="flex gap-4 my-6 items-center justify-center"
        role="group"
        aria-label={`PIN ${value.length} dari ${length} digit terisi`}
      >
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <div
              key={i}
              className={cn(
                "w-3.5 h-3.5 rounded-full border-2 transition-all duration-150",
                filled
                  ? "bg-indigo-500 border-indigo-400 scale-105"
                  : "bg-[#1E2333] border-white/20"
              )}
            />
          );
        })}
      </div>

      {/* Structured Numeric Keypad */}
      {showKeypad ? (
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[270px] mt-2">
          {[
            { num: "1", sub: "" },
            { num: "2", sub: "ABC" },
            { num: "3", sub: "DEF" },
            { num: "4", sub: "GHI" },
            { num: "5", sub: "JKL" },
            { num: "6", sub: "MNO" },
            { num: "7", sub: "PQRS" },
            { num: "8", sub: "TUV" },
            { num: "9", sub: "WXYZ" },
          ].map((item) => (
            <button
              key={item.num}
              type="button"
              aria-label={`Digit ${item.num} ${item.sub}`}
              disabled={disabled}
              onClick={() => handleDigit(item.num)}
              className="h-14 rounded-2xl bg-[#141724] hover:bg-[#1C2133] active:bg-[#242B42] flex flex-col items-center justify-center press-scale cursor-pointer select-none border border-white/[0.06] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-colors"
            >
              <span className="text-xl font-bold text-white leading-none">{item.num}</span>
              {item.sub ? (
                <span className="text-[8px] font-semibold text-slate-500 tracking-wider mt-0.5" aria-hidden="true">
                  {item.sub}
                </span>
              ) : null}
            </button>
          ))}

          {/* Empty placeholder */}
          <div className="h-14" aria-hidden="true" />

          {/* Zero Button */}
          <button
            type="button"
            aria-label="Digit 0"
            disabled={disabled}
            onClick={() => handleDigit("0")}
            className="h-14 rounded-2xl bg-[#141724] hover:bg-[#1C2133] active:bg-[#242B42] flex flex-col items-center justify-center press-scale cursor-pointer select-none border border-white/[0.06] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-colors"
          >
            <span className="text-xl font-bold text-white leading-none">0</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            aria-label="Hapus digit PIN"
            disabled={disabled}
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-[#141724] hover:bg-[#1C2133] flex items-center justify-center text-slate-400 hover:text-white press-scale cursor-pointer border border-white/[0.06] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-colors"
          >
            <Delete className="w-5 h-5 text-slate-400" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
