import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BottomSheet } from "../components/ui/BottomSheet";
import { NumberPad } from "../components/ui/NumberPad";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { EmptyState } from "../components/ui/EmptyState";
import { formatCurrency, relativeDate } from "../lib/format";
import {
  TransactionWithDetails,
  WalletWithBalance,
  Category,
} from "@my-finance/shared";
import {
  Plus,
  Trash2,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Wallet as WalletIcon,
  Calendar,
  FileText,
} from "lucide-react";

type FilterType = "all" | "expense" | "income" | "transfer";

export function Transactions() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterWallet, setFilterWallet] = useState("");

  // Form State
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState(0);
  const [walletId, setWalletId] = useState("");
  const [targetWalletId, setTargetWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [txs, wts, cats] = await Promise.all([
        apiFetch<TransactionWithDetails[]>("/api/transactions"),
        apiFetch<WalletWithBalance[]>("/api/wallets"),
        apiFetch<Category[]>("/api/categories"),
      ]);
      setTransactions(txs);
      setWallets(wts);
      setCategories(cats);
      if (wts.length > 0 && !walletId) {
        setWalletId(wts[0].id);
        if (wts.length > 1) setTargetWalletId(wts[1].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterWallet && tx.wallet_id !== filterWallet) return false;
      if (filterType === "expense" && tx.type !== "expense") return false;
      if (filterType === "income" && tx.type !== "income") return false;
      if (filterType === "transfer" && !tx.type.includes("transfer")) return false;
      return true;
    });
  }, [transactions, filterType, filterWallet]);

  const groupedByDate = useMemo(() => {
    const groups: Record<
      string,
      { items: TransactionWithDetails[]; dayNet: number }
    > = {};

    for (const tx of filteredTransactions) {
      if (!groups[tx.date]) {
        groups[tx.date] = { items: [], dayNet: 0 };
      }
      groups[tx.date].items.push(tx);
      if (tx.type === "income" || tx.type === "transfer_in") {
        groups[tx.date].dayNet += tx.amount;
      } else if (tx.type === "expense" || tx.type === "transfer_out") {
        groups[tx.date].dayNet -= tx.amount;
      }
    }
    return Object.entries(groups);
  }, [filteredTransactions]);

  const handleCreate = async () => {
    if (amount <= 0) return alert("Masukkan nominal transaksi");
    if (!walletId) return alert("Pilih dompet terlebih dahulu di menu Setelan");

    setLoading(true);
    try {
      if (type === "transfer") {
        await apiFetch("/api/transactions", {
          method: "POST",
          body: JSON.stringify({
            type: "transfer",
            source_wallet_id: walletId,
            target_wallet_id: targetWalletId,
            amount,
            date,
            note: note || undefined,
          }),
        });
      } else {
        await apiFetch("/api/transactions", {
          method: "POST",
          body: JSON.stringify({
            wallet_id: walletId,
            category_id: categoryId || null,
            type,
            amount,
            date,
            note: note || undefined,
          }),
        });
      }
      setIsAddOpen(false);
      setAmount(0);
      setNote("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat transaksi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini? Saldo dompet akan disesuaikan kembali.")) return;
    try {
      await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentAvailableCategories = categories.filter((c) => c.type === type);

  return (
    <div className="space-y-4 pt-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Aktivitas Keuangan
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Riwayat Transaksi
          </h1>
        </div>
        <Button size="sm" onClick={() => setIsAddOpen(true)} className="gap-1 shadow-sm">
          <Plus className="w-4 h-4" /> Catat
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="space-y-2">
        <SegmentedControl
          options={[
            { value: "all", label: "Semua" },
            { value: "expense", label: "Keluar" },
            { value: "income", label: "Masuk" },
            { value: "transfer", label: "Transfer" },
          ]}
          value={filterType}
          onChange={(val) => setFilterType(val as FilterType)}
        />

        {wallets.length > 1 ? (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterWallet("")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all press-scale cursor-pointer ${
                filterWallet === ""
                  ? "bg-slate-900 text-white shadow-sm"
                  : "glass-surface text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua Dompet
            </button>
            {wallets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setFilterWallet(w.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all press-scale flex items-center gap-1.5 cursor-pointer ${
                  filterWallet === w.id
                    ? "bg-[#007AFF] text-white shadow-[0_2px_8px_rgba(0,122,255,0.3)]"
                    : "glass-surface text-slate-600 hover:text-slate-900"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: w.color || "#007AFF" }}
                />
                {w.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Grouped Transaction List */}
      <div className="space-y-5">
        {groupedByDate.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-7 h-7" />}
            title="Belum ada transaksi"
            description="Tidak ada riwayat transaksi pada filter ini. Mulai catat keuangan harian Anda."
            action={
              <Button size="sm" onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Catat Sekarang
              </Button>
            }
          />
        ) : (
          groupedByDate.map(([groupDate, { items, dayNet }]) => (
            <div key={groupDate} className="space-y-2">
              {/* Date Header with Daily Net Summary */}
              <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>{relativeDate(groupDate)}</span>
                <span
                  className={`num-tabular font-semibold lowercase ${
                    dayNet >= 0 ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {dayNet >= 0 ? "+" : ""}
                  {formatCurrency(dayNet)}
                </span>
              </div>

              {items.map((tx) => (
                <Card
                  key={tx.id}
                  className="p-3.5 flex items-center justify-between border-slate-200/40"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        tx.type === "income" || tx.type === "transfer_in"
                          ? "bg-emerald-50 text-emerald-600"
                          : tx.type === "expense"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-indigo-50 text-indigo-600"
                      }`}
                    >
                      {tx.type === "income" || tx.type === "transfer_in" ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : tx.type === "expense" ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowRightLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {tx.note ||
                          tx.category_name ||
                          (tx.type.includes("transfer") ? "Transfer Saldo" : "Lainnya")}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-600">{tx.wallet_name}</span>
                        {tx.category_name && tx.note ? ` • ${tx.category_name}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-extrabold num-tabular ${
                        tx.type === "income" || tx.type === "transfer_in"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {tx.type === "income" || tx.type === "transfer_in" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-lg press-scale cursor-pointer"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Input Modal */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Catat Transaksi Baru"
        subtitle="Pilih jenis dan masukkan nominal transaksi Anda"
      >
        <div className="space-y-4">
          <SegmentedControl
            options={[
              { value: "expense", label: "Pengeluaran" },
              { value: "income", label: "Pemasukan" },
              { value: "transfer", label: "Transfer" },
            ]}
            value={type}
            onChange={(val) => {
              setType(val as any);
              setCategoryId("");
            }}
          />

          <NumberPad value={amount} onChange={setAmount} />

          <div className="space-y-3 pt-2">
            {/* Wallet Selection */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <WalletIcon className="w-3.5 h-3.5" /> Sumber Dompet
              </label>
              <div className="grid grid-cols-2 gap-2">
                {wallets.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWalletId(w.id)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all press-scale cursor-pointer ${
                      walletId === w.id
                        ? "bg-blue-50/70 border-[#007AFF] text-slate-900 shadow-sm"
                        : "bg-slate-50 border-slate-200/80 text-slate-600"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: w.color || "#007AFF" }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{w.name}</p>
                      <p className="text-[10px] text-slate-400 num-tabular truncate">
                        {formatCurrency(w.current_balance)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Wallet for Transfer */}
            {type === "transfer" ? (
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Dompet Tujuan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {wallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setTargetWalletId(w.id)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all press-scale cursor-pointer ${
                          targetWalletId === w.id
                            ? "bg-indigo-50/70 border-indigo-500 text-slate-900 shadow-sm"
                            : "bg-slate-50 border-slate-200/80 text-slate-600"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: w.color || "#6366F1" }}
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold truncate">{w.name}</p>
                          <p className="text-[10px] text-slate-400 num-tabular truncate">
                            {formatCurrency(w.current_balance)}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              /* Categories Chips */
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  Kategori
                </label>
                {currentAvailableCategories.length === 0 ? (
                  <p className="text-xs text-slate-400 py-1 italic">
                    Belum ada kategori untuk jenis ini.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {currentAvailableCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategoryId(categoryId === c.id ? "" : c.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all press-scale cursor-pointer ${
                          categoryId === c.id
                            ? "bg-[#007AFF] text-white shadow-sm"
                            : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Date & Note */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" /> Tanggal
                </label>
                <input
                  type="date"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#007AFF]"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <FileText className="w-3 h-3" /> Catatan
                </label>
                <input
                  type="text"
                  placeholder="Opsional (misal: Makan siang)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#007AFF]"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <Button size="lg" onClick={handleCreate} loading={loading} className="mt-3">
              Simpan Transaksi
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
