import { Delete } from "lucide-react";
import { formatCurrency } from "../../lib/format";

export interface NumberPadProps {
  value: number;
  onChange: (val: number) => void;
}

export function NumberPad({ value, onChange }: NumberPadProps) {
  const handleDigit = (digit: string) => {
    const currentStr = value === 0 ? "" : value.toString();
    if (currentStr.length >= 11) return; // Cap at 99 Milyar

    if (digit === "000") {
      if (value === 0) return;
      onChange(parseInt(currentStr + "000", 10));
    } else {
      onChange(parseInt(currentStr + digit, 10));
    }
  };

  const handleQuickAdd = (addVal: number) => {
    onChange((value || 0) + addVal);
  };

  const handleDelete = () => {
    const currentStr = value.toString();
    if (currentStr.length <= 1) {
      onChange(0);
    } else {
      onChange(parseInt(currentStr.slice(0, -1), 10));
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Amount Display */}
      <div className="w-full text-center py-5 my-2 glass-hero rounded-3xl border border-white/80 shadow-sm">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-1">
          Nominal Transaksi
        </p>
        <div
          className="text-3xl font-extrabold tracking-tight text-slate-900 num-tabular"
          aria-live="polite"
        >
          {formatCurrency(value)}
        </div>
      </div>

      {/* Quick Add Presets */}
      <div className="grid grid-cols-4 gap-2 w-full mt-2 mb-3">
        {[
          { label: "+50rb", val: 50000 },
          { label: "+100rb", val: 100000 },
          { label: "+500rb", val: 500000 },
          { label: "+1jt", val: 1000000 },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            aria-label={`Tambah ${item.label}`}
            onClick={() => handleQuickAdd(item.val)}
            className="py-1.5 px-1 bg-white/70 hover:bg-white active:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 press-scale cursor-pointer border border-slate-200/50 shadow-xs focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Grid Keypad */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0"].map((btn) => (
          <button
            key={btn}
            type="button"
            aria-label={`Digit ${btn}`}
            onClick={() => handleDigit(btn)}
            className="h-13 bg-white/75 hover:bg-white active:bg-slate-100 rounded-2xl text-xl font-bold text-slate-800 press-scale flex items-center justify-center cursor-pointer select-none border border-white/80 shadow-xs focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
          >
            {btn}
          </button>
        ))}
        <button
          type="button"
          aria-label="Hapus digit terakhir"
          onClick={handleDelete}
          className="h-13 bg-white/75 hover:bg-white active:bg-slate-100 rounded-2xl text-xl font-semibold text-slate-500 press-scale flex items-center justify-center cursor-pointer select-none border border-white/80 shadow-xs focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
        >
          <Delete className="w-5 h-5 text-slate-600" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
