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
        className="fixed inset-0 bg-slate-900/40 transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content with overscroll-contain */}
      <div className="relative w-full max-w-md bg-white border-t border-slate-200 rounded-t-2xl px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] shadow-xl z-10 max-h-[90dvh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom duration-200">
        {/* Grabber handle */}
        <div className="w-8 h-1 bg-slate-300 rounded-full mx-auto my-2" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 id="sheet-title" className="text-base font-bold text-slate-900">
              {title}
            </h3>
            {subtitle ? <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup lembar"
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center press-scale cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4338CA] focus-visible:outline-none"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
}
