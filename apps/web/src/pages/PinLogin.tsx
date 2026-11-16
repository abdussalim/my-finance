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
    <div className="flex flex-col items-center justify-center min-h-dvh px-5 py-6 text-center max-w-sm mx-auto relative select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      {/* Cyber Lock Icon */}
      <div
        className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 text-indigo-400 rounded-3xl flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(99,102,241,0.3)] relative z-10"
        aria-hidden="true"
      >
        <Lock className="w-7 h-7 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight text-white relative z-10">
        Buka My Finance
      </h1>
      <p className="text-xs font-medium text-slate-400 mt-1 mb-2 relative z-10">
        Terminal Keuangan Pribadi & Portofolio Bisnis
      </p>

      {lockedUntil ? (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3.5 bg-rose-500/15 text-rose-400 rounded-2xl text-xs font-semibold my-4 border border-rose-500/30 relative z-10"
        >
          Aplikasi terkunci sementara karena salah PIN. Tunggu hingga{" "}
          <span className="font-bold text-white">
            {new Date(lockedUntil).toLocaleTimeString("id-ID")}
          </span>
          .
        </div>
      ) : (
        <div className="w-full relative z-10">
          <PinInput value={pin} onChange={handlePin} disabled={loading} showKeypad />
          {error ? (
            <p role="alert" aria-live="polite" className="text-xs text-rose-400 font-bold mt-3 shadow-xs">
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
              Memverifikasi PIN…
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
