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
import { Plus, Trash2, ArrowRightLeft, ArrowDownRight, ArrowUpRight, Receipt } from "lucide-react";

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
    const groups: Record<string, TransactionWithDetails[]> = {};
    for (const tx of filteredTransactions) {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
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
            note,
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
            note,
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
    if (!confirm("Hapus transaksi ini?")) return;
    try {
      await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight">Riwayat Transaksi</h1>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Catat
        </Button>
      </div>

      {/* Filters */}
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
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilterWallet("")}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterWallet === "" ? "bg-[#1D1D1F] text-white" : "bg-white text-gray-500 border border-black/[0.04]"
              }`}
            >
              Semua Dompet
            </button>
            {wallets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setFilterWallet(w.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  filterWallet === w.id ? "bg-[#007AFF] text-white" : "bg-white text-gray-500 border border-black/[0.04]"
                }`}
              >
                {w.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Grouped Transaction List */}
      <div className="space-y-4">
        {groupedByDate.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-7 h-7" />}
            title="Belum ada transaksi"
            description="Catat pemasukan, pengeluaran, atau transfer antar dompet Anda."
            action={
              <Button size="sm" onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Catat Sekarang
              </Button>
            }
          />
        ) : (
          groupedByDate.map(([groupDate, items]) => (
            <div key={groupDate} className="space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                {relativeDate(groupDate)}
              </p>
              {items.map((tx) => (
                <Card key={tx.id} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                        tx.type === "income"
                          ? "bg-emerald-500"
                          : tx.type === "expense"
                          ? "bg-rose-500"
                          : "bg-blue-500"
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
                      <p className="text-xs font-bold text-[#1D1D1F]">
                        {tx.note || tx.category_name || (tx.type.includes("transfer") ? "Transfer Saldo" : "Lainnya")}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {tx.wallet_name} {tx.category_name && tx.note ? `• ${tx.category_name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-xs font-extrabold ${
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
                      className="text-gray-300 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
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
        title="Catat Transaksi"
      >
        <div className="space-y-4">
          <SegmentedControl
            options={[
              { value: "expense", label: "Pengeluaran" },
              { value: "income", label: "Pemasukan" },
              { value: "transfer", label: "Transfer" },
            ]}
            value={type}
            onChange={(val) => setType(val as any)}
          />

          <NumberPad value={amount} onChange={setAmount} />

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">Dompet</label>
              <select
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
              >
                {wallets.length === 0 ? (
                  <option value="">Belum ada dompet (Buat di Setelan)</option>
                ) : (
                  wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.current_balance)})
                    </option>
                  ))
                )}
              </select>
            </div>

            {type === "transfer" ? (
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Dompet Tujuan</label>
                <select
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                >
                  {wallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Kategori</label>
                <select
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">(Pilih Kategori)</option>
                  {categories
                    .filter((c) => c.type === type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Tanggal</label>
                <input
                  type="date"
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Catatan</label>
                <input
                  type="text"
                  placeholder="Opsional"
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <Button size="lg" onClick={handleCreate} loading={loading} className="mt-4">
              Simpan Transaksi
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
