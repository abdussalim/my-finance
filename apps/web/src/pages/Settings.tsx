import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BottomSheet } from "../components/ui/BottomSheet";
import { NumberPad } from "../components/ui/NumberPad";
import { PinInput } from "../components/ui/PinInput";
import { formatCurrency } from "../lib/format";
import { useAuth } from "../hooks/useAuth";
import { WalletWithBalance, Category } from "@my-finance/shared";
import { Wallet, Tag, LogOut, Plus, Trash2, Info, KeyRound, X } from "lucide-react";

const WALLET_COLORS = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#5856D6", "#1D1D1F"];

export function Settings() {
  const { logout } = useAuth();
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Add Wallet Modal
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [wName, setWName] = useState("");
  const [wType, setWType] = useState<"bank" | "cash" | "ewallet">("bank");
  const [wColor, setWColor] = useState(WALLET_COLORS[0]);
  const [wBalance, setWBalance] = useState(0);

  // Add Category Modal
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cType, setCType] = useState<"expense" | "income">("expense");

  // Change PIN Modal
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [pinStep, setPinStep] = useState<"old" | "new">("old");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  const loadData = async () => {
    try {
      const [wts, cats] = await Promise.all([
        apiFetch<WalletWithBalance[]>("/api/wallets"),
        apiFetch<Category[]>("/api/categories"),
      ]);
      setWallets(wts);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddWallet = async () => {
    if (!wName) return alert("Masukkan nama dompet");
    try {
      await apiFetch("/api/wallets", {
        method: "POST",
        body: JSON.stringify({
          name: wName,
          type: wType,
          color: wColor,
          initial_balance: wBalance,
        }),
      });
      setIsWalletOpen(false);
      setWName("");
      setWBalance(0);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddCategory = async () => {
    if (!cName) return alert("Masukkan nama kategori");
    try {
      await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: cName, type: cType }),
      });
      setIsCatOpen(false);
      setCName("");
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm("Hapus dompet ini?")) return;
    try {
      await apiFetch(`/api/wallets/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Hapus kategori ini?")) return;
    try {
      await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOldPin = (val: string) => {
    setOldPin(val);
    setPinError(null);
    if (val.length === 6) {
      setTimeout(() => setPinStep("new"), 150);
    }
  };

  const handleNewPin = async (val: string) => {
    setNewPin(val);
    setPinError(null);
    if (val.length === 6) {
      setPinLoading(true);
      try {
        await apiFetch("/api/auth/change-pin", {
          method: "POST",
          body: JSON.stringify({ old_pin: oldPin, new_pin: val }),
        });
        setIsPinOpen(false);
        setOldPin("");
        setNewPin("");
        setPinStep("old");
        alert("PIN berhasil diubah!");
      } catch (err: any) {
        setPinError(err.message || "Gagal mengubah PIN");
        setOldPin("");
        setNewPin("");
        setPinStep("old");
      } finally {
        setPinLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight">Setelan Aplikasi</h1>

      {/* Section Wallets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
            <Wallet className="w-4 h-4" /> Dompet & Rekening
          </div>
          <Button size="sm" variant="ghost" onClick={() => setIsWalletOpen(true)}>
            <Plus className="w-4 h-4 mr-0.5" /> Tambah
          </Button>
        </div>
        <Card className="p-2 divide-y divide-gray-100">
          {wallets.length === 0 ? (
            <p className="p-4 text-xs text-gray-400 text-center">Belum ada dompet. Silakan tambah.</p>
          ) : (
            wallets.map((w) => (
              <div key={w.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: w.color || "#007AFF" }}
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1D1D1F]">{w.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{w.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-gray-700">
                    {formatCurrency(w.current_balance)}
                  </span>
                  <button
                    onClick={() => handleDeleteWallet(w.id)}
                    className="text-gray-300 hover:text-red-500 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Section Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
            <Tag className="w-4 h-4" /> Kategori Transaksi
          </div>
          <Button size="sm" variant="ghost" onClick={() => setIsCatOpen(true)}>
            <Plus className="w-4 h-4 mr-0.5" /> Tambah
          </Button>
        </div>
        <Card className="p-3">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 text-[11px] font-semibold pl-2.5 pr-1.5 py-1 bg-gray-100 rounded-lg text-gray-700"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    c.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                {c.name}
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  className="text-gray-400 hover:text-red-500 ml-0.5 cursor-pointer"
                  title="Hapus kategori"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Section Security */}
      <div className="space-y-2">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            setPinStep("old");
            setOldPin("");
            setNewPin("");
            setPinError(null);
            setIsPinOpen(true);
          }}
        >
          <KeyRound className="w-4 h-4 mr-2" /> Ubah Master PIN
        </Button>
      </div>

      {/* Section Info */}
      <Card className="p-4 flex items-center gap-3 bg-blue-50/50 border-blue-100">
        <Info className="w-5 h-5 text-[#007AFF]" />
        <div className="text-xs text-gray-600">
          <p className="font-bold text-[#1D1D1F]">My Finance PWA v1.0</p>
          <p className="text-[11px] text-gray-400">Edge Workers + D1 • finance.abdussalim.my.id</p>
        </div>
      </Card>

      {/* Logout */}
      <Button variant="danger" size="lg" onClick={logout}>
        <LogOut className="w-4 h-4 mr-2" /> Kunci Aplikasi (Logout)
      </Button>

      {/* Add Wallet Modal */}
      <BottomSheet
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        title="Tambah Dompet"
      >
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Nama Dompet</label>
            <input
              type="text"
              placeholder="Contoh: BCA, Tunai, GoPay"
              className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              value={wName}
              onChange={(e) => setWName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">Tipe</label>
              <select
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                value={wType}
                onChange={(e) => setWType(e.target.value as any)}
              >
                <option value="bank">Bank</option>
                <option value="cash">Tunai (Cash)</option>
                <option value="ewallet">E-Wallet</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">Warna</label>
              <div className="flex gap-1.5 mt-2">
                {WALLET_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setWColor(col)}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                      wColor === col ? "scale-115 ring-2 ring-offset-1 ring-gray-400" : ""
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Saldo Awal</label>
            <NumberPad value={wBalance} onChange={setWBalance} />
          </div>
          <Button size="lg" onClick={handleAddWallet} className="mt-4">
            Simpan Dompet
          </Button>
        </div>
      </BottomSheet>

      {/* Add Category Modal */}
      <BottomSheet
        isOpen={isCatOpen}
        onClose={() => setIsCatOpen(false)}
        title="Tambah Kategori"
      >
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Nama Kategori</label>
            <input
              type="text"
              placeholder="Contoh: Kopi, Laundry, Freelance"
              className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">Tipe</label>
            <select
              className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              value={cType}
              onChange={(e) => setCType(e.target.value as any)}
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>
          <Button size="lg" onClick={handleAddCategory} className="mt-4">
            Simpan Kategori
          </Button>
        </div>
      </BottomSheet>

      {/* Change PIN Modal */}
      <BottomSheet
        isOpen={isPinOpen}
        onClose={() => setIsPinOpen(false)}
        title="Ubah Master PIN"
      >
        <div className="text-center py-2">
          <p className="text-sm font-semibold text-gray-700">
            {pinStep === "old" ? "Masukkan PIN Lama (6 digit)" : "Masukkan PIN Baru (6 digit)"}
          </p>
          <PinInput
            value={pinStep === "old" ? oldPin : newPin}
            onChange={pinStep === "old" ? handleOldPin : handleNewPin}
            disabled={pinLoading}
          />
          {pinError ? <p className="text-xs text-red-500 font-semibold">{pinError}</p> : null}
        </div>
      </BottomSheet>
    </div>
  );
}
