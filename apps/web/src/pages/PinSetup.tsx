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
      setTimeout(() => setStep("confirm"), 200);
    }
  };

  const handleConfirmPin = async (pin: string) => {
    setConfirmPin(pin);
    setError(null);
    if (pin.length === 6) {
      if (pin !== firstPin) {
        setError("PIN tidak cocok! Silakan coba lagi.");
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
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="w-16 h-16 bg-blue-50 text-[#007AFF] rounded-3xl flex items-center justify-center mb-6">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
        {step === "create" ? "Buat Master PIN" : "Konfirmasi PIN"}
      </h2>
      <p className="text-sm text-gray-500 mt-2 max-w-xs">
        {step === "create"
          ? "Atur 6-digit PIN untuk mengamankan data keuangan pribadi Anda."
          : "Masukkan kembali 6-digit PIN yang Anda buat tadi."}
      </p>

      <PinInput
        value={step === "create" ? firstPin : confirmPin}
        onChange={step === "create" ? handleFirstPin : handleConfirmPin}
        disabled={loading}
      />

      {error ? <p className="text-sm text-red-500 font-medium">{error}</p> : null}
      {loading ? <p className="text-sm text-gray-400 mt-2">Menyimpan PIN...</p> : null}
    </div>
  );
}
