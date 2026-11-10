import { Delete } from "lucide-react";
import { formatCurrency } from "../../lib/format";

export interface NumberPadProps {
  value: number;
  onChange: (val: number) => void;
}

export function NumberPad({ value, onChange }: NumberPadProps) {
  const handleDigit = (digit: string) => {
    const currentStr = value === 0 ? "" : value.toString();
    if (currentStr.length >= 11) return; // Cap at Rp 99.000.000.000

    if (digit === "000") {
      if (value === 0) return;
      onChange(parseInt(currentStr + "000", 10));
    } else {
      onChange(parseInt(currentStr + digit, 10));
    }
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
      <div className="w-full text-center py-4 my-2 bg-gray-50 rounded-2xl border border-gray-100">
        <span className="text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
          {formatCurrency(value)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 w-full mt-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0"].map((btn) => (
          <button
            key={btn}
            type="button"
            onClick={() => handleDigit(btn)}
            className="h-14 bg-gray-100/80 active:bg-gray-200 rounded-2xl text-xl font-semibold text-[#1D1D1F] transition-all flex items-center justify-center cursor-pointer"
          >
            {btn}
          </button>
        ))}
        <button
          type="button"
          onClick={handleDelete}
          className="h-14 bg-gray-100/80 active:bg-gray-200 rounded-2xl text-xl font-semibold text-gray-500 transition-all flex items-center justify-center cursor-pointer"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
