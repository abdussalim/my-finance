import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { formatCurrency, relativeDate } from "../lib/format";
import { DashboardSummary, WalletWithBalance } from "@my-finance/shared";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  HandCoins,
  ArrowRight,
  Eye,
  EyeOff,
  TrendingUp,
  PlusCircle,
} from "lucide-react";
import { Link } from "react-router";

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sum, wlt] = await Promise.all([
          apiFetch<DashboardSummary>("/api/dashboard/summary"),
          apiFetch<WalletWithBalance[]>("/api/wallets"),
        ]);
        setSummary(sum);
        setWallets(wlt);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-6 space-y-4 animate-pulse" role="status" aria-label="Memuat data ikhtisar…">
        <div className="h-36 glass-surface rounded-3xl" />
        <div className="h-24 glass-surface rounded-3xl" />
        <div className="h-36 glass-surface rounded-3xl" />
      </div>
    );
  }

  const netSavings = (summary?.month_income || 0) - (summary?.month_expense || 0);
  const incomeTotal = summary?.month_income || 0;
  const expenseTotal = summary?.month_expense || 0;
  const flowTotal = incomeTotal + expenseTotal;
  const incomePercent = flowTotal > 0 ? Math.round((incomeTotal / flowTotal) * 100) : 50;

  return (
    <div className="space-y-6 pt-4">
      {/* Top Bar with Date & Eye Privacy Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </span>
          <h1 className="text-base font-bold text-slate-800">Ringkasan Finansial</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowBalance(!showBalance)}
          aria-label={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          className="w-9 h-9 rounded-full glass-surface flex items-center justify-center text-slate-500 hover:text-slate-800 press-scale cursor-pointer focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
        >
          {showBalance ? (
            <Eye className="w-4 h-4" aria-hidden="true" />
          ) : (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Hero Net Worth Card (Signature Soft-Glass) */}
      <div className="glass-hero rounded-3xl p-6 relative overflow-hidden border border-white/80">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Saldo Bersih
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-100">
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            Aktif
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 num-tabular">
          {showBalance ? formatCurrency(summary?.total_balance || 0) : "••••••••"}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Arus Kas Bersih Bulan Ini</span>
          <span
            className={`font-bold num-tabular ${
              netSavings >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {showBalance
              ? `${netSavings >= 0 ? "+" : ""}${formatCurrency(netSavings)}`
              : "••••••"}
          </span>
        </div>
      </div>

      {/* Monthly Cashflow Analytics Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Arus Kas Bulan Ini
          </h2>
          <span className="text-[11px] font-medium text-slate-400">
            {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100/60">
            <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold">Pemasukan</span>
            </div>
            <p className="text-base font-bold text-emerald-700 num-tabular">
              {showBalance ? formatCurrency(incomeTotal) : "••••••"}
            </p>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100/60">
            <div className="flex items-center gap-1.5 text-rose-600 mb-1">
              <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold">Pengeluaran</span>
            </div>
            <p className="text-base font-bold text-rose-700 num-tabular">
              {showBalance ? formatCurrency(expenseTotal) : "••••••"}
            </p>
          </div>
        </div>

        {/* Visual Cashflow Ratio Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Pemasukan ({incomePercent}%)</span>
            <span>Pengeluaran ({100 - incomePercent}%)</span>
          </div>
          <div
            className="w-full h-2 rounded-full bg-rose-200 overflow-hidden flex"
            role="progressbar"
            aria-label="Rasio arus kas masuk versus keluar"
            aria-valuenow={incomePercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-emerald-500 transition-[width] duration-500 ease-out rounded-l-full"
              style={{ width: `${incomePercent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Wallets Horizontal Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Dompet & Rekening ({wallets.length})
          </h2>
          <Link
            to="/settings"
            className="text-xs font-semibold text-[#007AFF] flex items-center gap-0.5 hover:underline focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none rounded-md"
          >
            Kelola <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {wallets.length === 0 ? (
            <div className="p-5 text-xs text-slate-400 glass-surface rounded-2xl w-full text-center">
              Belum ada dompet. Tambahkan rekening atau dompet di menu Setelan.
            </div>
          ) : (
            wallets.map((w) => (
              <div
                key={w.id}
                className="min-w-[155px] glass-surface rounded-2xl p-4 flex flex-col justify-between border border-white/80 shadow-xs"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs"
                    style={{ backgroundColor: w.color || "#007AFF" }}
                  >
                    <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 truncate">{w.name}</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">{w.type}</p>
                  <p className="text-sm font-extrabold text-slate-900 num-tabular">
                    {showBalance ? formatCurrency(w.current_balance) : "••••••"}
                  </p>
                </div>
              </div>
            ))
          )}
          <Link
            to="/settings"
            aria-label="Tambah Dompet Baru"
            className="min-w-[120px] glass-surface rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-dashed border-slate-300 text-slate-400 hover:text-[#007AFF] hover:border-[#007AFF] press-scale focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
          >
            <PlusCircle className="w-6 h-6 mb-1 text-slate-400" aria-hidden="true" />
            <span className="text-xs font-semibold">Tambah</span>
          </Link>
        </div>
      </div>

      {/* Debt & Receivable Quick Highlight */}
      <Link
        to="/debts"
        className="block rounded-3xl focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
      >
        <Card
          interactive
          className="p-4 flex items-center justify-between bg-gradient-to-r from-amber-50/70 to-orange-50/70 border-amber-200/60"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-xs">
              <HandCoins className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Catatan Hutang & Piutang</p>
              <p className="text-xs text-amber-700/90 mt-0.5 num-tabular">
                Hutang: <b>{showBalance ? formatCurrency(summary?.total_debt || 0) : "••••"}</b> •
                Piutang:{" "}
                <b>{showBalance ? formatCurrency(summary?.total_receivable || 0) : "••••"}</b>
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-700" aria-hidden="true" />
        </Card>
      </Link>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Transaksi Terakhir
          </h2>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-[#007AFF] hover:underline focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none rounded-md"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="space-y-2">
          {summary?.recent_transactions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 glass-surface rounded-3xl">
              Belum ada transaksi tercatat.
            </p>
          ) : (
            summary?.recent_transactions.map((tx) => (
              <Card
                key={tx.id}
                className="p-3.5 flex items-center justify-between border-slate-200/40"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                      tx.type === "income" || tx.type === "transfer_in"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {tx.type === "income" || tx.type === "transfer_in" ? (
                      <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {tx.note ||
                        tx.category_name ||
                        (tx.type.includes("transfer") ? "Transfer Antar Dompet" : "Pengeluaran")}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {tx.wallet_name} • {relativeDate(tx.date)}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-extrabold num-tabular ${
                    tx.type === "income" || tx.type === "transfer_in"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {tx.type === "income" || tx.type === "transfer_in" ? "+" : "-"}
                  {showBalance ? formatCurrency(tx.amount) : "••••"}
                </span>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
