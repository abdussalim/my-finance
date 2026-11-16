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
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content with overscroll-contain */}
      <div className="relative w-full max-w-md bg-[#121622]/95 backdrop-blur-2xl border-t border-white/10 text-[#F8FAFC] rounded-t-3xl px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] shadow-[0_-12px_40px_rgba(0,0,0,0.8)] z-10 max-h-[90dvh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom duration-200">
        {/* Grabber handle */}
        <div className="w-9 h-1 bg-white/20 rounded-full mx-auto my-2" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
          <div>
            <h3 id="sheet-title" className="text-base font-bold text-white tracking-tight">
              {title}
            </h3>
            {subtitle ? <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup lembar"
            className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center press-scale cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none transition-colors"
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
