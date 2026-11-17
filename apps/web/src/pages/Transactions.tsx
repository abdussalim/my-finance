import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Button } from "../components/ui/Button";
import { BottomSheet } from "../components/ui/BottomSheet";
import { NumberPad } from "../components/ui/NumberPad";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { EmptyState } from "../components/ui/EmptyState";
import { formatCurrency, relativeDate } from "../lib/format";
import { getProjectLogo } from "../lib/project-utils";
import {
  TransactionWithDetails,
  WalletWithBalance,
  Category,
  ProjectWithStats,
} from "@my-finance/shared";
import {
  Plus,
  Trash2,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Briefcase,
} from "lucide-react";

type FilterType = "all" | "expense" | "income" | "transfer";

export function Transactions() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterWallet, setFilterWallet] = useState("");
  const [filterProject, setFilterProject] = useState("");

  // Form State
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState(0);
  const [walletId, setWalletId] = useState("");
  const [targetWalletId, setTargetWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [txs, wts, cats, prjs] = await Promise.all([
        apiFetch<TransactionWithDetails[]>("/api/transactions"),
        apiFetch<WalletWithBalance[]>("/api/wallets"),
        apiFetch<Category[]>("/api/categories"),
        apiFetch<ProjectWithStats[]>("/api/projects"),
      ]);
      setTransactions(txs);
      setWallets(wts);
      setCategories(cats);
      setProjects(prjs);
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
      if (filterProject && tx.project_id !== filterProject) return false;
      if (filterType === "expense" && tx.type !== "expense") return false;
      if (filterType === "income" && tx.type !== "income") return false;
      if (filterType === "transfer" && !tx.type.includes("transfer")) return false;
      return true;
    });
  }, [transactions, filterType, filterWallet, filterProject]);

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
    if (amount <= 0) return alert("Masukkan nominal transaksi yang valid");
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
            project_id: projectId || null,
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
      setProjectId("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat transaksi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini? Saldo dompet terkait akan disesuaikan kembali.")) return;
    try {
      await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentAvailableCategories = categories.filter((c) => c.type === type);

  return (
    <div className="space-y-5 pt-2 pb-6">
      {/* 1. iOS Large Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transaksi</h1>
          <p className="text-xs text-[rgba(235,235,245,0.60)] mt-0.5">Catatan arus kas pribadi dan proyek bisnis</p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="gap-1.5 shadow-sm"
          aria-label="Catat Transaksi Baru"
        >
          <Plus className="w-4 h-4" /> <span>Catat</span>
        </Button>
      </div>

      {/* 2. iOS Segmented Controls & Inset Filters */}
      <div className="space-y-2.5">
        <SegmentedControl
          ariaLabel="Filter Jenis Transaksi"
          options={[
            { value: "all", label: "Semua" },
            { value: "expense", label: "Keluar" },
            { value: "income", label: "Masuk" },
            { value: "transfer", label: "Transfer" },
          ]}
          value={filterType}
          onChange={(val) => setFilterType(val as FilterType)}
        />

        {/* Filter by Project */}
        {projects.length > 0 ? (
          <div
            className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
            role="group"
            aria-label="Filter berdasarkan proyek"
          >
            <button
              type="button"
              onClick={() => setFilterProject("")}
              aria-pressed={filterProject === ""}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ios-press cursor-pointer ${
                filterProject === ""
                  ? "bg-[#0A84FF] text-white"
                  : "bg-[rgba(118,118,128,0.24)] text-[rgba(235,235,245,0.70)] hover:text-white"
              }`}
            >
              Semua Proyek
            </button>
            {projects.map((p) => {
              const logo = getProjectLogo(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFilterProject(p.id)}
                  aria-pressed={filterProject === p.id}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ios-press flex items-center gap-1.5 cursor-pointer ${
                    filterProject === p.id
                      ? "bg-[#0A84FF] text-white"
                      : "bg-[rgba(118,118,128,0.24)] text-[rgba(235,235,245,0.70)] hover:text-white"
                  }`}
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt=""
                      className="w-3.5 h-3.5 rounded-[4px] object-contain bg-black/20"
                    />
                  ) : (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: p.color || "#0A84FF" }}
                      aria-hidden="true"
                    />
                  )}
                  {p.name}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Filter by Wallet */}
        {wallets.length > 1 ? (
          <div
            className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
            role="group"
            aria-label="Filter berdasarkan dompet"
          >
            <button
              type="button"
              onClick={() => setFilterWallet("")}
              aria-pressed={filterWallet === ""}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ios-press cursor-pointer ${
                filterWallet === ""
                  ? "bg-[#3A3A3C] text-white"
                  : "bg-[rgba(118,118,128,0.24)] text-[rgba(235,235,245,0.70)] hover:text-white"
              }`}
            >
              Semua Dompet
            </button>
            {wallets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setFilterWallet(w.id)}
                aria-pressed={filterWallet === w.id}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ios-press flex items-center gap-1.5 cursor-pointer ${
                  filterWallet === w.id
                    ? "bg-[#3A3A3C] text-white"
                    : "bg-[rgba(118,118,128,0.24)] text-[rgba(235,235,245,0.70)] hover:text-white"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: w.color || "#0A84FF" }}
                  aria-hidden="true"
                />
                {w.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* 3. iOS Inset Grouped Transaction Lists */}
      <div className="space-y-4">
        {groupedByDate.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-6 h-6" />}
            title="Belum ada transaksi"
            description="Tidak ada riwayat transaksi pada filter ini. Mulai catat keuangan harian atau transaksi proyek Anda."
            action={
              <Button size="sm" onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-1" aria-hidden="true" /> Catat Sekarang
              </Button>
            }
          />
        ) : (
          groupedByDate.map(([groupDate, { items, dayNet }]) => (
            <div key={groupDate} className="space-y-1.5">
              {/* Date Header with Daily Net Summary */}
              <div className="flex items-center justify-between px-2 text-[12px] font-semibold text-[rgba(235,235,245,0.60)] uppercase tracking-wider">
                <span>{relativeDate(groupDate)}</span>
                <span
                  className={`num-tabular font-semibold ${
                    dayNet >= 0 ? "text-[#30D158]" : "text-[#FF453A]"
                  }`}
                >
                  {dayNet >= 0 ? "+" : ""}
                  {formatCurrency(dayNet)}
                </span>
              </div>

              {/* iOS Inset Grouped Card */}
              <div className="bg-[#1C1C1E] rounded-[20px] border border-white/[0.06] overflow-hidden divide-y divide-white/[0.06]">
                {items.map((tx) => (
                  <div
                    key={tx.id}
                    className="ios-row flex items-center justify-between p-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
                          tx.type === "income" || tx.type === "transfer_in"
                            ? "bg-[#30D158]/15 text-[#30D158]"
                            : tx.type === "expense"
                            ? "bg-[#FF453A]/15 text-[#FF453A]"
                            : "bg-[#0A84FF]/15 text-[#0A84FF]"
                        }`}
                      >
                        {tx.type === "income" || tx.type === "transfer_in" ? (
                          <ArrowDownRight className="w-4 h-4 stroke-[2.2]" />
                        ) : tx.type === "expense" ? (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                        ) : (
                          <ArrowRightLeft className="w-4 h-4 stroke-[2.2]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-white truncate">
                            {tx.note ||
                              tx.category_name ||
                              (tx.type.includes("transfer") ? "Transfer Saldo" : "Lainnya")}
                          </p>
                          {tx.project_name ? (
                            <span
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase border shrink-0 flex items-center gap-1"
                              style={{
                                color: tx.project_color || "#0A84FF",
                                borderColor: `${tx.project_color || "#0A84FF"}30`,
                                backgroundColor: `${tx.project_color || "#0A84FF"}15`,
                              }}
                            >
                              {(() => {
                                const logo = getProjectLogo({
                                  id: tx.project_id,
                                  code: tx.project_code,
                                  name: tx.project_name,
                                  project_logo: tx.project_logo,
                                });
                                return logo ? (
                                  <img
                                    src={logo}
                                    alt=""
                                    className="w-3 h-3 object-contain rounded-xs"
                                  />
                                ) : null;
                              })()}
                              <span>{tx.project_code || tx.project_name.slice(0, 3)}</span>
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-[rgba(235,235,245,0.60)] mt-0.5 truncate">
                          <span className="font-medium text-[#EBEBF5]">{tx.wallet_name}</span>
                          {tx.category_name && tx.note ? ` • ${tx.category_name}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-2">
                      <span
                        className={`text-xs font-bold num-tabular ${
                          tx.type === "income" || tx.type === "transfer_in"
                            ? "text-[#30D158]"
                            : "text-[#FF453A]"
                        }`}
                      >
                        {tx.type === "income" || tx.type === "transfer_in" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(tx.id)}
                        className="text-[rgba(235,235,245,0.60)] hover:text-[#FF453A] p-1.5 rounded-lg ios-press cursor-pointer transition-colors"
                        aria-label={`Hapus transaksi ${tx.note || tx.category_name || "ini"}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. iOS Input Bottom Sheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Catat Transaksi"
        subtitle="Pilih jenis dan masukkan nominal transaksi"
      >
        <div className="space-y-4">
          <SegmentedControl
            ariaLabel="Pilih Jenis Transaksi"
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

          <div className="space-y-3 pt-1">
            {/* Project Selector (Tautkan ke Proyek Bisnis) */}
            {type !== "transfer" && projects.length > 0 ? (
              <div>
                <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.60)] uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#0A84FF]" aria-hidden="true" /> Tautkan ke Proyek (Opsional)
                </span>
                <div
                  className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"
                  role="group"
                  aria-label="Pilih proyek untuk transaksi"
                >
                  <button
                    type="button"
                    onClick={() => setProjectId("")}
                    aria-pressed={projectId === ""}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ios-press ${
                      projectId === ""
                        ? "bg-[#0A84FF] text-white"
                        : "bg-[rgba(118,118,128,0.24)] text-[rgba(235,235,245,0.60)] hover:text-white"
                    }`}
                  >
                    Pribadi / Umum
                  </button>
                  {projects.map((p) => {
                    const logo = getProjectLogo(p);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProjectId(p.id)}
                        aria-pressed={projectId === p.id}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ios-press flex items-center gap-1.5 cursor-pointer ${
                          projectId === p.id
                            ? "bg-[#0A84FF] text-white"
                            : "bg-[rgba(118,118,128,0.24)] text-[rgba(235,235,245,0.60)] hover:text-white"
                        }`}
                      >
                        {logo ? (
                          <img
                            src={logo}
                            alt=""
                            className="w-3.5 h-3.5 rounded-[4px] object-contain bg-black/20"
                          />
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: p.color || "#0A84FF" }}
                            aria-hidden="true"
                          />
                        )}
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {type === "transfer" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">
                    Dari Dompet
                  </label>
                  <select
                    className="w-full bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#0A84FF]"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(w.current_balance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">
                    Ke Dompet
                  </label>
                  <select
                    className="w-full bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#0A84FF]"
                    value={targetWalletId}
                    onChange={(e) => setTargetWalletId(e.target.value)}
                  >
                    {wallets
                      .filter((w) => w.id !== walletId)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatCurrency(w.current_balance)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">
                    Dompet
                  </label>
                  <select
                    className="w-full bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#0A84FF]"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(w.current_balance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">
                    Kategori
                  </label>
                  <select
                    className="w-full bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#0A84FF]"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">(Pilih Kategori)</option>
                    {currentAvailableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  className="w-full bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#0A84FF]"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Catatan transaksi…"
                  className="w-full bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] px-3.5 py-2.5 text-xs text-white placeholder-[rgba(235,235,245,0.35)] focus:outline-none focus:border-[#0A84FF]"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleCreate}
              loading={loading}
              disabled={amount <= 0}
              className="w-full mt-2"
            >
              Simpan Transaksi
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
