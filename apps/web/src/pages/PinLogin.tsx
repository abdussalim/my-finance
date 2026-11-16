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
    <div className="flex flex-col items-center justify-center min-h-dvh px-5 py-6 text-center max-w-sm mx-auto select-none">
      {/* Clean Lock Icon */}
      <div
        className="w-14 h-14 bg-[#141724] border border-white/[0.08] text-indigo-400 rounded-2xl flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        <Lock className="w-6 h-6" />
      </div>

      <h1 className="text-xl font-bold tracking-tight text-white">
        Buka My Finance
      </h1>
      <p className="text-xs text-slate-400 mt-1 mb-2">
        Manajemen Keuangan Pribadi & Multi-Proyek
      </p>

      {lockedUntil ? (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3 bg-red-500/10 text-red-400 rounded-xl text-xs font-medium my-4 border border-red-500/20"
        >
          Aplikasi terkunci sementara karena salah PIN. Tunggu hingga{" "}
          <span className="font-semibold text-white">
            {new Date(lockedUntil).toLocaleTimeString("id-ID")}
          </span>
          .
        </div>
      ) : (
        <div className="w-full">
          <PinInput value={pin} onChange={handlePin} disabled={loading} showKeypad />
          {error ? (
            <p role="alert" aria-live="polite" className="text-xs text-red-400 font-medium mt-3">
              {error}
            </p>
          ) : null}
          {loading ? (
            <p
              role="status"
              aria-live="polite"
              className="text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5"
            >
              <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Memverifikasi PIN…
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
