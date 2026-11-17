import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { PinInput } from "../components/ui/PinInput";
import { ShieldCheck } from "lucide-react";

export function PinSetup() {
  const { setup } = useAuth();
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [firstPin, setFirstPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFirstPin = (pin: string) => {
    setFirstPin(pin);
    setError(null);
    if (pin.length === 6) {
      setTimeout(() => setStep("confirm"), 150);
    }
  };

  const handleConfirmPin = async (pin: string) => {
    setConfirmPin(pin);
    setError(null);
    if (pin.length === 6) {
      if (pin !== firstPin) {
        setError("PIN tidak cocok! Silakan ulangi.");
        setConfirmPin("");
        return;
      }
      setLoading(true);
      try {
        await setup(pin);
      } catch (err: any) {
        setError(err.message || "Gagal membuat PIN");
        setConfirmPin("");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-5 py-6 text-center max-w-sm mx-auto select-none bg-black">
      {/* iOS Round Shield Icon */}
      <div
        className="w-14 h-14 bg-[#1C1C1E] border border-white/[0.06] text-[#0A84FF] rounded-[18px] flex items-center justify-center mb-3 shadow-sm"
        aria-hidden="true"
      >
        <ShieldCheck className="w-6 h-6 stroke-[2]" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-white">
        {step === "create" ? "Buat Master PIN" : "Konfirmasi PIN"}
      </h1>
      <p className="text-xs text-[rgba(235,235,245,0.60)] mt-1 mb-2 max-w-xs">
        {step === "create"
          ? "Atur 6-digit PIN untuk mengamankan data keuangan dan proyek Anda."
          : "Masukkan kembali 6-digit PIN yang telah dibuat."}
      </p>

      <div className="w-full">
        <PinInput
          value={step === "create" ? firstPin : confirmPin}
          onChange={step === "create" ? handleFirstPin : handleConfirmPin}
          disabled={loading}
          showKeypad
        />
        {error ? (
          <p role="alert" aria-live="polite" className="text-xs text-[#FF453A] font-medium mt-3">
            {error}
          </p>
        ) : null}
        {loading ? (
          <p
            role="status"
            aria-live="polite"
            className="text-xs text-[rgba(235,235,245,0.60)] mt-3 flex items-center justify-center gap-1.5"
          >
            <span className="w-3.5 h-3.5 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
            Menyimpan PIN…
          </p>
        ) : null}
      </div>
    </div>
  );
}
