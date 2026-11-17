import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
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
  ChevronRight,
} from "lucide-react";

const WALLET_COLORS = [
  "#0A84FF", // iOS Blue
  "#30D158", // iOS Green
  "#FF9F0A", // iOS Amber
  "#FF453A", // iOS Red
  "#5E5CE6", // iOS Indigo
  "#BF5AF2", // iOS Purple
  "#64D2FF", // iOS Cyan
  "#FF375F", // iOS Pink
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
    <div className="space-y-6 pt-2 pb-8">
      {/* 1. iOS Large Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Setelan</h1>
        <p className="text-xs text-[rgba(235,235,245,0.60)] mt-0.5">Konfigurasi dompet, kategori, dan keamanan</p>
      </div>

      {/* 2. Inset Grouped Section: Wallets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3">
          <span className="text-[12px] font-medium text-[rgba(235,235,245,0.60)] uppercase tracking-wider">
            Dompet & Rekening ({wallets.length})
          </span>
          <button
            type="button"
            onClick={() => setIsWalletOpen(true)}
            className="text-xs font-semibold text-[#0A84FF] hover:opacity-80 ios-press flex items-center gap-0.5 cursor-pointer"
            aria-label="Tambah Dompet Baru"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Tambah
          </button>
        </div>

        <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] overflow-hidden divide-y divide-white/[0.06]">
          {wallets.length === 0 ? (
            <p className="p-4 text-xs text-[rgba(235,235,245,0.60)] text-center">
              Belum ada dompet. Tambahkan rekening atau dompet kas Anda.
            </p>
          ) : (
            wallets.map((w) => (
              <div key={w.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: w.color || "#0A84FF" }}
                  >
                    <Wallet className="w-4 h-4 stroke-[2]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{w.name}</p>
                    <p className="text-[10px] text-[rgba(235,235,245,0.60)] uppercase font-medium">{w.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-white num-tabular">
                    {formatCurrency(w.current_balance)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteWallet(w.id, w.name)}
                    className="text-[rgba(235,235,245,0.60)] hover:text-[#FF453A] p-1.5 rounded-[8px] ios-press cursor-pointer transition-colors"
                    aria-label={`Hapus dompet ${w.name}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Inset Grouped Section: Categories */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3">
          <span className="text-[12px] font-medium text-[rgba(235,235,245,0.60)] uppercase tracking-wider">
            Kategori Transaksi ({categories.length})
          </span>
          <button
            type="button"
            onClick={() => setIsCatOpen(true)}
            className="text-xs font-semibold text-[#0A84FF] hover:opacity-80 ios-press flex items-center gap-0.5 cursor-pointer"
            aria-label="Tambah Kategori Baru"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Tambah
          </button>
        </div>

        <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-3.5">
          <div className="flex flex-wrap gap-2" role="list" aria-label="Daftar Kategori">
            {categories.map((c) => (
              <span
                key={c.id}
                role="listitem"
                className="inline-flex items-center gap-1.5 text-xs font-medium pl-3 pr-2 py-1.5 bg-[rgba(118,118,128,0.24)] rounded-full text-white"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    c.type === "income" ? "bg-[#30D158]" : "bg-[#FF453A]"
                  }`}
                  aria-hidden="true"
                />
                {c.name}
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c.id, c.name)}
                  className="text-[rgba(235,235,245,0.60)] hover:text-[#FF453A] ml-0.5 p-0.5 rounded-full cursor-pointer focus:outline-none transition-colors"
                  aria-label={`Hapus kategori ${c.name}`}
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Inset Grouped Section: Security */}
      <div className="space-y-2">
        <div className="px-3">
          <span className="text-[12px] font-medium text-[rgba(235,235,245,0.60)] uppercase tracking-wider">
            Keamanan
          </span>
        </div>

        <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] overflow-hidden divide-y divide-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              setPinStep("old");
              setOldPin("");
              setNewPin("");
              setPinError(null);
              setIsPinOpen(true);
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left ios-press cursor-pointer hover:bg-[rgba(118,118,128,0.24)]/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[9px] bg-[#30D158] flex items-center justify-center text-white shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4 stroke-[2]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Master PIN 6-Digit</p>
                <p className="text-xs text-[rgba(235,235,245,0.60)]">Kunci pengaman transaksi & akun</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[rgba(235,235,245,0.60)]">
              <span>Ubah</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </div>
          </button>
        </div>
      </div>

      {/* 5. Inset Grouped Section: System Architecture Badge */}
      <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-[9px] bg-[#5E5CE6] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
            <Cpu className="w-4 h-4 stroke-[2]" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white" translate="no">My Finance v2.0</p>
              <span className="text-[10px] font-medium text-[#30D158] bg-[#30D158]/15 px-2 py-0.5 rounded-full">
                &lt; 10ms CPU
              </span>
            </div>
            <p className="text-xs text-[rgba(235,235,245,0.60)] mt-0.5">
              Cloudflare Pages + Edge Workers + D1 Database
            </p>
            <p className="text-[11px] text-[rgba(235,235,245,0.60)]/80 mt-1 flex items-center gap-1" translate="no">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" /> finance.abdussalim.my.id
            </p>
          </div>
        </div>
      </div>

      {/* 6. iOS Logout Action */}
      <button
        type="button"
        onClick={logout}
        className="w-full bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-3.5 text-center text-[#FF453A] font-semibold text-sm ios-press cursor-pointer flex items-center justify-center gap-2 hover:bg-[rgba(118,118,128,0.24)]/50 transition-colors"
        aria-label="Kunci Aplikasi dan Keluar"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" /> Kunci Aplikasi (Logout)
      </button>

      {/* Add Wallet Bottom Sheet */}
      <BottomSheet
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        title="Tambah Dompet Baru"
        subtitle="Buat rekening bank, e-wallet, atau kas"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="wallet-name" className="text-[11px] font-semibold text-[rgba(235,235,245,0.60)] uppercase tracking-wider mb-1.5 block">
              Nama Dompet
            </label>
            <input
              id="wallet-name"
              name="wallet_name"
              type="text"
              placeholder="Contoh: BCA, Kas Tunai, GoPay…"
              className="w-full px-3.5 py-2.5 bg-[rgba(118,118,128,0.24)] border border-transparent focus:border-[#0A84FF] rounded-[14px] text-xs font-semibold text-white placeholder-[rgba(235,235,245,0.35)] focus:outline-none"
              value={wName}
              onChange={(e) => setWName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.60)] uppercase tracking-wider block">
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

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.60)] uppercase tracking-wider block">
              Warna Kartu
            </span>
            <div className="flex gap-2.5 py-1" role="group" aria-label="Pilih warna dompet">
              {WALLET_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  aria-label={`Pilih warna ${col}`}
                  onClick={() => setWColor(col)}
                  className={`w-7 h-7 rounded-full cursor-pointer transition-transform duration-120 ios-press focus:outline-none ${
                    wColor === col ? "scale-115 ring-2 ring-offset-2 ring-offset-[#1C1C1E] ring-[#0A84FF]" : ""
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.60)] uppercase tracking-wider mb-1.5 block">
              Saldo Awal
            </span>
            <NumberPad value={wBalance} onChange={setWBalance} />
          </div>

          <Button size="lg" onClick={handleAddWallet} className="mt-2 w-full rounded-[14px]">
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
            <label htmlFor="category-name" className="text-[11px] font-semibold text-[rgba(235,235,245,0.60)] uppercase tracking-wider mb-1.5 block">
              Nama Kategori
            </label>
            <input
              id="category-name"
              name="category_name"
              type="text"
              placeholder="Contoh: Kopi, Makanan, Gaji…"
              className="w-full px-3.5 py-2.5 bg-[rgba(118,118,128,0.24)] border border-transparent focus:border-[#0A84FF] rounded-[14px] text-xs font-semibold text-white placeholder-[rgba(235,235,245,0.35)] focus:outline-none"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.60)] uppercase tracking-wider block">
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

          <Button size="lg" onClick={handleAddCategory} className="mt-2 w-full rounded-[14px]">
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
        <div className="text-center py-2">
          <PinInput
            value={pinStep === "old" ? oldPin : newPin}
            onChange={pinStep === "old" ? handleOldPin : handleNewPin}
            disabled={pinLoading}
          />
          {pinError ? (
            <p className="text-xs text-[#FF453A] font-medium mt-3" role="alert">{pinError}</p>
          ) : null}
        </div>
      </BottomSheet>
    </div>
  );
}
