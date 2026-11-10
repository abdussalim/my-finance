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
        setError(err.message || "PIN salah");
        setPin("");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="w-16 h-16 bg-gray-100 text-[#1D1D1F] rounded-3xl flex items-center justify-center mb-6">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Masukkan PIN</h2>
      <p className="text-sm text-gray-500 mt-2">Buka catatan keuangan Anda</p>

      {lockedUntil ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold mt-6 max-w-xs">
          Aplikasi terkunci karena beberapa kali salah PIN. Silakan tunggu hingga{" "}
          {new Date(lockedUntil).toLocaleTimeString("id-ID")}.
        </div>
      ) : (
        <>
          <PinInput value={pin} onChange={handlePin} disabled={loading} />
          {error ? <p className="text-sm text-red-500 font-medium">{error}</p> : null}
        </>
      )}
    </div>
  );
}
