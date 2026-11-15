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
      setTimeout(() => setStep("confirm"), 180);
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
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-8 text-center max-w-sm mx-auto">
      {/* Icon */}
      <div
        className="w-16 h-16 glass-surface text-[#007AFF] rounded-3xl flex items-center justify-center mb-5 border border-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
        aria-hidden="true"
      >
        <ShieldCheck className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        {step === "create" ? "Buat Master PIN" : "Konfirmasi PIN"}
      </h1>
      <p className="text-xs font-medium text-slate-400 mt-1 mb-2 max-w-xs">
        {step === "create"
          ? "Atur 6-digit PIN untuk mengamankan seluruh transaksi dan catatan finansial Anda."
          : "Masukkan kembali 6-digit PIN yang telah Anda buat."}
      </p>

      <PinInput
        value={step === "create" ? firstPin : confirmPin}
        onChange={step === "create" ? handleFirstPin : handleConfirmPin}
        disabled={loading}
        showKeypad
      />

      {error ? (
        <p role="alert" aria-live="polite" className="text-xs text-rose-500 font-bold mt-2">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-slate-400 font-medium mt-3 flex items-center gap-1.5 justify-center"
        >
          <span
            className="w-3.5 h-3.5 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          Menyimpan PIN…
        </p>
      ) : null}
    </div>
  );
}
