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
    <div className="flex flex-col items-center justify-center min-h-dvh px-5 py-6 text-center max-w-sm mx-auto relative select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      {/* Cyber Shield Icon */}
      <div
        className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 text-indigo-400 rounded-3xl flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(99,102,241,0.3)] relative z-10"
        aria-hidden="true"
      >
        <ShieldCheck className="w-8 h-8 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight text-white relative z-10">
        {step === "create" ? "Buat Master PIN" : "Konfirmasi PIN"}
      </h1>
      <p className="text-xs font-medium text-slate-400 mt-1 mb-2 max-w-xs relative z-10">
        {step === "create"
          ? "Atur 6-digit PIN untuk mengamankan data finansial dan bisnis Anda."
          : "Masukkan kembali 6-digit PIN yang telah Anda buat."}
      </p>

      <div className="w-full relative z-10">
        <PinInput
          value={step === "create" ? firstPin : confirmPin}
          onChange={step === "create" ? handleFirstPin : handleConfirmPin}
          disabled={loading}
          showKeypad
        />

        {error ? (
          <p role="alert" aria-live="polite" className="text-xs text-rose-400 font-bold mt-3">
            {error}
          </p>
        ) : null}
        {loading ? (
          <p
            role="status"
            aria-live="polite"
            className="text-xs text-indigo-300 font-medium mt-3 flex items-center gap-2 justify-center"
          >
            <span
              className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            Menyimpan PIN…
          </p>
        ) : null}
      </div>
    </div>
  );
}
