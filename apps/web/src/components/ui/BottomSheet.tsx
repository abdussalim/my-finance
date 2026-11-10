import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
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
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
