import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { PinInput } from "../components/ui/PinInput";
import { Lock } from "lucide-react";

export function PinLogin() {
  const { login, lockedUntil } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePin = async (inputPin: string) => {
    setPin(inputPin);
    setError(null);
    if (inputPin.length === 6) {
      setLoading(true);
      try {
        await login(inputPin);
      } catch (err: any) {
        setError(err.message || "PIN salah, periksa kembali");
        setPin("");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-8 text-center max-w-sm mx-auto">
      {/* Lock Icon */}
      <div className="w-16 h-16 glass-surface text-slate-800 rounded-3xl flex items-center justify-center mb-5 border border-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
        <Lock className="w-7 h-7 text-[#007AFF]" />
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Buka My Finance
      </h1>
      <p className="text-xs font-medium text-slate-400 mt-1 mb-2">
        Masukkan 6-digit Master PIN Anda
      </p>

      {lockedUntil ? (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-semibold my-6 border border-rose-200">
          Aplikasi terkunci karena beberapa kali salah PIN. Silakan tunggu hingga{" "}
          <span className="font-bold">
            {new Date(lockedUntil).toLocaleTimeString("id-ID")}
          </span>
          .
        </div>
      ) : (
        <>
          <PinInput value={pin} onChange={handlePin} disabled={loading} showKeypad />
          {error ? (
            <p className="text-xs text-rose-500 font-bold mt-2 animate-shake">{error}</p>
          ) : null}
          {loading ? (
            <p className="text-xs text-slate-400 font-medium mt-3 flex items-center gap-1.5 justify-center">
              <span className="w-3.5 h-3.5 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
              Memverifikasi PIN...
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
