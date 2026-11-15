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
    // If keypad is not shown, focus hidden input for physical/software keyboard
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
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits.slice(0, length));
        }}
        disabled={disabled}
        className="opacity-0 absolute -z-10 w-0 h-0"
      />

      {/* 6 Passcode Indicators (Apple Style) */}
      <div className="flex gap-4 my-6 items-center justify-center">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <div
              key={i}
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-all duration-200",
                filled
                  ? "bg-[#007AFF] border-[#007AFF] scale-110 shadow-[0_0_12px_rgba(0,122,255,0.4)]"
                  : "bg-slate-200/60 border-slate-300"
              )}
            />
          );
        })}
      </div>

      {/* Circular Apple-Style Numeric Keypad */}
      {showKeypad ? (
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[280px] mt-2">
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
              disabled={disabled}
              onClick={() => handleDigit(item.num)}
              className="w-18 h-18 rounded-full bg-white/80 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center press-scale cursor-pointer active:bg-slate-100 mx-auto"
            >
              <span className="text-2xl font-bold text-slate-800 leading-none">{item.num}</span>
              {item.sub ? (
                <span className="text-[9px] font-semibold text-slate-400 tracking-wider mt-0.5">
                  {item.sub}
                </span>
              ) : null}
            </button>
          ))}

          {/* Empty placeholder */}
          <div className="w-18 h-18" />

          {/* Zero Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleDigit("0")}
            className="w-18 h-18 rounded-full bg-white/80 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center press-scale cursor-pointer active:bg-slate-100 mx-auto"
          >
            <span className="text-2xl font-bold text-slate-800 leading-none">0</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={handleDelete}
            className="w-18 h-18 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 press-scale cursor-pointer mx-auto"
            title="Hapus"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
