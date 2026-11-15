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
  Plus,
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
      <div className="py-5 space-y-3 animate-pulse" role="status" aria-label="Memuat data ikhtisar…">
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
        <div className="h-24 bg-white rounded-2xl border border-slate-200" />
        <div className="h-36 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  const netSavings = (summary?.month_income || 0) - (summary?.month_expense || 0);
  const incomeTotal = summary?.month_income || 0;
  const expenseTotal = summary?.month_expense || 0;
  const flowTotal = incomeTotal + expenseTotal;
  const incomePercent = flowTotal > 0 ? Math.round((incomeTotal / flowTotal) * 100) : 50;

  return (
    <div className="space-y-4 pt-3">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <h1 className="text-base font-bold text-slate-900">Dashboard Keuangan</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowBalance(!showBalance)}
          aria-label={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 press-scale cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4338CA] focus-visible:outline-none shadow-2xs"
        >
          {showBalance ? (
            <Eye className="w-4 h-4" aria-hidden="true" />
          ) : (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Core Metric Card */}
      <Card className="p-4 border-slate-200/90 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4338CA] to-[#6366F1]" aria-hidden="true" />
        <div className="flex items-center justify-between mb-1.5 pt-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Kekayaan Bersih
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4338CA] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/70">
            <TrendingUp className="w-3 h-3 text-[#4338CA]" aria-hidden="true" />
            Aktif
          </span>
        </div>

        <div className="text-3xl font-extrabold text-[#0F172A] num-tabular tracking-tight my-1">
          {showBalance ? formatCurrency(summary?.total_balance || 0) : "••••••••"}
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Net Arus Kas Bulan Ini</span>
          <span
            className={`font-bold num-tabular ${
              netSavings >= 0 ? "text-[#0D9488]" : "text-[#E11D48]"
            }`}
          >
            {showBalance
              ? `${netSavings >= 0 ? "+" : ""}${formatCurrency(netSavings)}`
              : "••••••"}
          </span>
        </div>
      </Card>

      {/* Monthly Cashflow Analytics Grid */}
      <Card className="p-4 border-slate-200/90">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Arus Kas Bulan Ini
          </h2>
          <span className="text-[11px] font-medium text-slate-500">
            {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200/80">
            <div className="flex items-center gap-1.5 text-[#0D9488] mb-1">
              <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-bold">Pemasukan</span>
            </div>
            <p className="text-base font-extrabold text-teal-900 num-tabular">
              {showBalance ? formatCurrency(incomeTotal) : "••••••"}
            </p>
          </div>

          <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200/80">
            <div className="flex items-center gap-1.5 text-[#E11D48] mb-1">
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-bold">Pengeluaran</span>
            </div>
            <p className="text-base font-extrabold text-rose-900 num-tabular">
              {showBalance ? formatCurrency(expenseTotal) : "••••••"}
            </p>
          </div>
        </div>

        {/* Visual Cashflow Ratio Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-500 font-medium num-tabular">
            <span>Pemasukan ({incomePercent}%)</span>
            <span>Pengeluaran ({100 - incomePercent}%)</span>
          </div>
          <div
            className="w-full h-2 rounded-full bg-rose-200/90 overflow-hidden flex border border-slate-200/60"
            role="progressbar"
            aria-label="Rasio arus kas masuk versus keluar"
            aria-valuenow={incomePercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-[#0D9488] transition-[width] duration-300 ease-out"
              style={{ width: `${incomePercent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Wallets & Accounts Section */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Dompet & Rekening ({wallets.length})
          </h2>
          <Link
            to="/settings"
            className="text-xs font-semibold text-[#4338CA] flex items-center gap-0.5 hover:underline focus-visible:ring-2 focus-visible:ring-[#4338CA] focus-visible:outline-none rounded-sm"
          >
            Kelola <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {wallets.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 bg-white rounded-xl border border-slate-200 w-full text-center">
              Belum ada dompet. Tambahkan rekening atau dompet di menu Setelan.
            </div>
          ) : (
            wallets.map((w) => (
              <div
                key={w.id}
                className="min-w-[145px] bg-white rounded-xl p-3.5 flex flex-col justify-between border border-slate-200/90 shadow-2xs hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                    style={{ backgroundColor: w.color || "#4338CA" }}
                  >
                    <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate">{w.name}</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">{w.type}</p>
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
            className="min-w-[100px] bg-white rounded-xl p-3 flex flex-col items-center justify-center text-center border border-dashed border-slate-300 text-slate-500 hover:text-[#4338CA] hover:border-[#4338CA] press-scale focus-visible:ring-2 focus-visible:ring-[#4338CA] focus-visible:outline-none shadow-2xs"
          >
            <Plus className="w-5 h-5 mb-0.5 text-slate-500" aria-hidden="true" />
            <span className="text-xs font-semibold">Tambah</span>
          </Link>
        </div>
      </div>

      {/* Debt & Receivable Status Highlight */}
      <Link
        to="/debts"
        className="block rounded-xl focus-visible:ring-2 focus-visible:ring-[#4338CA] focus-visible:outline-none"
      >
        <Card
          interactive
          className="p-3.5 flex items-center justify-between bg-amber-50/70 border-amber-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
              <HandCoins className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Status Hutang & Piutang</p>
              <p className="text-xs text-amber-800 mt-0.5 num-tabular">
                Hutang: <b>{showBalance ? formatCurrency(summary?.total_debt || 0) : "••••"}</b> •
                Piutang:{" "}
                <b>{showBalance ? formatCurrency(summary?.total_receivable || 0) : "••••"}</b>
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-700" aria-hidden="true" />
        </Card>
      </Link>

      {/* Recent Transactions List (8.3 Table / List from data-dashboard.md) */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Transaksi Terakhir
          </h2>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-[#4338CA] hover:underline focus-visible:ring-2 focus-visible:ring-[#4338CA] focus-visible:outline-none rounded-sm"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="space-y-1.5">
          {summary?.recent_transactions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6 bg-white rounded-xl border border-slate-200">
              Belum ada transaksi tercatat.
            </p>
          ) : (
            summary?.recent_transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 bg-white rounded-xl border border-slate-200/90 flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.type === "income" || tx.type === "transfer_in"
                        ? "bg-teal-50 text-[#0D9488] border border-teal-200/60"
                        : "bg-rose-50 text-[#E11D48] border border-rose-200/60"
                    }`}
                  >
                    {tx.type === "income" || tx.type === "transfer_in" ? (
                      <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {tx.note ||
                        tx.category_name ||
                        (tx.type.includes("transfer") ? "Transfer Antar Dompet" : "Pengeluaran")}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {tx.wallet_name} • {relativeDate(tx.date)}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-extrabold num-tabular ${
                    tx.type === "income" || tx.type === "transfer_in"
                      ? "text-[#0D9488]"
                      : "text-[#E11D48]"
                  }`}
                >
                  {tx.type === "income" || tx.type === "transfer_in" ? "+" : "-"}
                  {showBalance ? formatCurrency(tx.amount) : "••••"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
