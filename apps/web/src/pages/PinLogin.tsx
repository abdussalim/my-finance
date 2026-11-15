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
    <div className="flex flex-col items-center justify-center min-h-dvh px-5 py-6 text-center max-w-sm mx-auto">
      {/* Functional Lock Icon */}
      <div
        className="w-14 h-14 bg-white border border-slate-200/90 text-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-[0_2px_8px_rgba(67,56,202,0.08)]"
        aria-hidden="true"
      >
        <Lock className="w-6 h-6 text-[#4338CA]" />
      </div>

      <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
        Buka My Finance
      </h1>
      <p className="text-xs font-medium text-slate-500 mt-1 mb-2">
        Masukkan 6-digit Master PIN Anda
      </p>

      {lockedUntil ? (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3.5 bg-rose-50 text-[#E11D48] rounded-xl text-xs font-semibold my-4 border border-rose-200"
        >
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
            <p role="alert" aria-live="polite" className="text-xs text-[#E11D48] font-bold mt-2">
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
                className="w-3.5 h-3.5 border-2 border-[#4338CA] border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Memverifikasi PIN…
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
