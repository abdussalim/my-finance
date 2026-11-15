import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, subtitle, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Dimmed backdrop with blur */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative w-full max-w-md bg-white rounded-t-[36px] px-6 pt-3 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] shadow-[0_-12px_40px_rgba(0,0,0,0.12)] z-10 max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom duration-250">
        {/* Grabber handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto my-2.5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">{title}</h3>
            {subtitle ? <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center press-scale cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
}
