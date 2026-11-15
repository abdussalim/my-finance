import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BottomSheet } from "../components/ui/BottomSheet";
import { NumberPad } from "../components/ui/NumberPad";
import { PinInput } from "../components/ui/PinInput";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { formatCurrency } from "../lib/format";
import { useAuth } from "../hooks/useAuth";
import { WalletWithBalance, Category } from "@my-finance/shared";
import {
  Wallet,
  Tag,
  LogOut,
  Plus,
  Trash2,
  ShieldCheck,
  KeyRound,
  X,
  Cpu,
  Layers,
} from "lucide-react";

const WALLET_COLORS = [
  "#007AFF", // iOS Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#F43F5E", // Rose
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#0F172A", // Slate Dark
];

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
    if (!wName.trim()) return alert("Masukkan nama dompet");
    try {
      await apiFetch("/api/wallets", {
        method: "POST",
        body: JSON.stringify({
          name: wName.trim(),
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
    if (!cName.trim()) return alert("Masukkan nama kategori");
    try {
      await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: cName.trim(), type: cType }),
      });
      setIsCatOpen(false);
      setCName("");
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteWallet = async (id: string, name: string) => {
    if (!confirm(`Hapus dompet ${name}? Riwayat transaksi lama mungkin terpengaruh.`)) return;
    try {
      await apiFetch(`/api/wallets/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori ${name}?`)) return;
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
        alert("Master PIN berhasil diperbarui!");
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
    <div className="space-y-6 pt-4">
      {/* Top Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Preferensi & Konfigurasi
        </span>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Setelan Aplikasi
        </h1>
      </div>

      {/* Section Wallets */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Wallet className="w-3.5 h-3.5" aria-hidden="true" /> Dompet & Rekening ({wallets.length})
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsWalletOpen(true)}
            className="text-xs text-[#007AFF] font-bold"
            aria-label="Tambah Dompet Baru"
          >
            <Plus className="w-3.5 h-3.5 mr-0.5" aria-hidden="true" /> Tambah
          </Button>
        </div>

        <Card className="p-2 divide-y divide-slate-100">
          {wallets.length === 0 ? (
            <p className="p-5 text-xs text-slate-400 text-center">
              Belum ada dompet. Tambahkan rekening atau dompet kas Anda.
            </p>
          ) : (
            wallets.map((w) => (
              <div key={w.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs"
                    style={{ backgroundColor: w.color || "#007AFF" }}
                  >
                    <Wallet className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{w.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">{w.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-800 num-tabular">
                    {formatCurrency(w.current_balance)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteWallet(w.id, w.name)}
                    className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg press-scale cursor-pointer focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
                    aria-label={`Hapus dompet ${w.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Section Categories */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5" aria-hidden="true" /> Kategori Transaksi ({categories.length})
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsCatOpen(true)}
            className="text-xs text-[#007AFF] font-bold"
            aria-label="Tambah Kategori Baru"
          >
            <Plus className="w-3.5 h-3.5 mr-0.5" aria-hidden="true" /> Tambah
          </Button>
        </div>

        <Card className="p-3.5">
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Daftar Kategori">
            {categories.map((c) => (
              <span
                key={c.id}
                role="listitem"
                className="inline-flex items-center gap-1.5 text-xs font-semibold pl-2.5 pr-1.5 py-1.5 bg-slate-100/90 rounded-xl text-slate-700 border border-slate-200/50"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    c.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                  aria-hidden="true"
                />
                {c.name}
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c.id, c.name)}
                  className="text-slate-400 hover:text-rose-500 ml-0.5 p-0.5 rounded cursor-pointer focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
                  aria-label={`Hapus kategori ${c.name}`}
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Section Security & Passcode */}
      <div className="space-y-2.5">
        <h2 className="px-1 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Keamanan Akun
        </h2>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Master PIN 6-Digit</p>
              <p className="text-[11px] text-slate-400">
                Lindungi akses transaksi dan data finansial pribadi
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setPinStep("old");
                setOldPin("");
                setNewPin("");
                setPinError(null);
                setIsPinOpen(true);
              }}
              className="text-xs font-bold"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1 text-[#007AFF]" aria-hidden="true" /> Ubah PIN
            </Button>
          </div>
        </Card>
      </div>

      {/* Section Architecture & System Badge */}
      <Card className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border-blue-100/80">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Cpu className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-900" translate="no">My Finance PWA v1.0</p>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full">
                &lt; 10ms CPU
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cloudflare Pages + Edge Workers + D1 Database
            </p>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1" translate="no">
              <Layers className="w-3 h-3" aria-hidden="true" /> finance.abdussalim.my.id
            </p>
          </div>
        </div>
      </Card>

      {/* Logout Button */}
      <Button
        variant="danger"
        size="lg"
        onClick={logout}
        className="gap-2 shadow-sm"
        aria-label="Kunci Aplikasi dan Keluar"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" /> Kunci Aplikasi (Logout)
      </Button>

      {/* Add Wallet Bottom Sheet */}
      <BottomSheet
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        title="Tambah Dompet Baru"
        subtitle="Buat rekening bank, e-wallet, atau dompet tunai"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="wallet-name" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Nama Dompet
            </label>
            <input
              id="wallet-name"
              name="wallet_name"
              type="text"
              placeholder="Contoh: BCA, Dompet Tunai, GoPay…"
              className="w-full p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-900 focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
              value={wName}
              onChange={(e) => setWName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tipe Dompet
            </span>
            <SegmentedControl
              ariaLabel="Pilih jenis dompet"
              options={[
                { value: "bank", label: "Bank" },
                { value: "cash", label: "Tunai" },
                { value: "ewallet", label: "E-Wallet" },
              ]}
              value={wType}
              onChange={(val) => setWType(val as any)}
            />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Warna Kartu
            </span>
            <div className="flex gap-2 py-1" role="group" aria-label="Pilih warna dompet">
              {WALLET_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  aria-label={`Pilih warna ${col}`}
                  onClick={() => setWColor(col)}
                  className={`w-7 h-7 rounded-full cursor-pointer transition-transform duration-150 press-scale focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none ${
                    wColor === col ? "scale-110 ring-2 ring-offset-2 ring-slate-400 shadow-xs" : ""
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Saldo Awal
            </span>
            <NumberPad value={wBalance} onChange={setWBalance} />
          </div>

          <Button size="lg" onClick={handleAddWallet} className="mt-2">
            Simpan Dompet
          </Button>
        </div>
      </BottomSheet>

      {/* Add Category Bottom Sheet */}
      <BottomSheet
        isOpen={isCatOpen}
        onClose={() => setIsCatOpen(false)}
        title="Tambah Kategori Baru"
        subtitle="Kelompokkan transaksi pemasukan dan pengeluaran"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="category-name" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Nama Kategori
            </label>
            <input
              id="category-name"
              name="category_name"
              type="text"
              placeholder="Contoh: Kopi & Cafe, Transportasi…"
              className="w-full p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-900 focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Jenis Kategori
            </span>
            <SegmentedControl
              ariaLabel="Pilih jenis kategori"
              options={[
                { value: "expense", label: "Pengeluaran" },
                { value: "income", label: "Pemasukan" },
              ]}
              value={cType}
              onChange={(val) => setCType(val as any)}
            />
          </div>

          <Button size="lg" onClick={handleAddCategory} className="mt-2">
            Simpan Kategori
          </Button>
        </div>
      </BottomSheet>

      {/* Change PIN Bottom Sheet */}
      <BottomSheet
        isOpen={isPinOpen}
        onClose={() => setIsPinOpen(false)}
        title="Ubah Master PIN"
        subtitle={
          pinStep === "old"
            ? "Masukkan 6-digit PIN lama Anda"
            : "Masukkan 6-digit PIN baru yang ingin digunakan"
        }
      >
        <div className="text-center py-4">
          <PinInput
            value={pinStep === "old" ? oldPin : newPin}
            onChange={pinStep === "old" ? handleOldPin : handleNewPin}
            disabled={pinLoading}
          />
          {pinError ? (
            <p className="text-xs text-rose-500 font-bold mt-2" role="alert">{pinError}</p>
          ) : null}
        </div>
      </BottomSheet>
    </div>
  );
}
