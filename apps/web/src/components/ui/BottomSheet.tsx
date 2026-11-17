import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, subtitle, children }: BottomSheetProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* iOS Sheet Content with overscroll-contain */}
      <div className="relative w-full max-w-md bg-[#1C1C1E] border-t border-white/[0.1] text-[#FFFFFF] rounded-t-[28px] px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] shadow-2xl z-10 max-h-[92dvh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom duration-200">
        {/* iOS Grabber Pill */}
        <div className="w-9 h-1 bg-white/20 rounded-full mx-auto my-2 shrink-0" aria-hidden="true" />

        {/* iOS Navigation Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
          <div className="min-w-0 pr-2">
            <h3 id="sheet-title" className="text-base font-semibold text-white tracking-tight truncate">
              {title}
            </h3>
            {subtitle ? <p className="text-xs text-[#8E8E93] mt-0.5 truncate">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup lembar"
            className="w-7 h-7 rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#8E8E93] hover:text-white flex items-center justify-center ios-press cursor-pointer focus-visible:outline-none transition-colors shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
}
