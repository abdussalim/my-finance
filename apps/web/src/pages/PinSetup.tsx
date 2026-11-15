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
    <div className="flex flex-col items-center justify-center min-h-dvh px-5 py-6 text-center max-w-sm mx-auto">
      {/* Icon */}
      <div
        className="w-14 h-14 bg-blue-50 text-[#2563EB] border border-blue-200 rounded-2xl flex items-center justify-center mb-4 shadow-2xs"
        aria-hidden="true"
      >
        <ShieldCheck className="w-7 h-7" />
      </div>

      <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
        {step === "create" ? "Buat Master PIN" : "Konfirmasi PIN"}
      </h1>
      <p className="text-xs font-medium text-slate-500 mt-1 mb-2 max-w-xs">
        {step === "create"
          ? "Atur 6-digit PIN untuk mengamankan data finansial pribadi Anda."
          : "Masukkan kembali 6-digit PIN yang telah Anda buat."}
      </p>

      <PinInput
        value={step === "create" ? firstPin : confirmPin}
        onChange={step === "create" ? handleFirstPin : handleConfirmPin}
        disabled={loading}
        showKeypad
      />

      {error ? (
        <p role="alert" aria-live="polite" className="text-xs text-[#DC2626] font-bold mt-2">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1.5 justify-center"
        >
          <span
            className="w-3.5 h-3.5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          Menyimpan PIN…
        </p>
      ) : null}
    </div>
  );
}
