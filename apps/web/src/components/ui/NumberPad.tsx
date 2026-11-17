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
      {/* iOS Large Currency Display */}
      <div className="w-full text-center py-4 my-1 bg-[#1C1C1E] rounded-[20px] border border-white/[0.06]">
        <p className="text-[11px] font-medium tracking-wide text-[#8E8E93] uppercase mb-0.5">
          Nominal Transaksi
        </p>
        <div
          className="text-3xl sm:text-4xl font-bold tracking-tight text-white num-tabular"
          aria-live="polite"
        >
          {formatCurrency(value)}
        </div>
      </div>

      {/* iOS Quick Add Preset Chips */}
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
            className="py-1.5 px-1 bg-[#2C2C2E] hover:bg-[#3A3A3C] active:bg-[#48484A] rounded-full text-xs font-semibold text-[#0A84FF] ios-press cursor-pointer border border-white/[0.04] transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* iOS Keypad Grid */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0"].map((btn) => (
          <button
            key={btn}
            type="button"
            aria-label={`Digit ${btn}`}
            onClick={() => handleDigit(btn)}
            className="h-13 bg-[#1C1C1E] hover:bg-[#2C2C2E] active:bg-[#3A3A3C] rounded-[16px] text-xl font-medium text-white ios-press flex items-center justify-center cursor-pointer select-none border border-white/[0.04] transition-colors"
          >
            {btn}
          </button>
        ))}
        <button
          type="button"
          aria-label="Hapus digit terakhir"
          onClick={handleDelete}
          className="h-13 bg-[#1C1C1E] hover:bg-[#2C2C2E] active:bg-[#3A3A3C] rounded-[16px] text-xl font-medium text-[#8E8E93] hover:text-white ios-press flex items-center justify-center cursor-pointer select-none border border-white/[0.04] transition-colors"
        >
          <Delete className="w-5 h-5 text-[#8E8E93]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
