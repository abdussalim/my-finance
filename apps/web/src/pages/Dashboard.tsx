import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { formatCurrency, relativeDate } from "../lib/format";
import { DashboardSummary, WalletWithBalance, ProjectWithStats } from "@my-finance/shared";
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
  Briefcase,
  Layers,
} from "lucide-react";
import { Link } from "react-router";

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sum, wlt, prjs] = await Promise.all([
          apiFetch<DashboardSummary>("/api/dashboard/summary"),
          apiFetch<WalletWithBalance[]>("/api/wallets"),
          apiFetch<ProjectWithStats[]>("/api/projects"),
        ]);
        setSummary(sum);
        setWallets(wlt);
        setProjects(prjs);
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
        <div className="h-36 bg-white/[0.04] rounded-2xl border border-white/[0.08]" />
        <div className="h-28 bg-white/[0.04] rounded-2xl border border-white/[0.08]" />
        <div className="h-36 bg-white/[0.04] rounded-2xl border border-white/[0.08]" />
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
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400/90 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Dashboard Keuangan
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowBalance(!showBalance)}
          aria-label={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white press-scale cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none shadow-xs transition-colors"
        >
          {showBalance ? (
            <Eye className="w-4 h-4" aria-hidden="true" />
          ) : (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Core Net Worth Hero Card */}
      <Card className="p-4 relative overflow-hidden border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-[#11141E]/90 to-[#121622] shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-500" aria-hidden="true" />
        <div className="flex items-center justify-between mb-1.5 pt-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Kekayaan Bersih
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
            <TrendingUp className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            Live
          </span>
        </div>

        <div className="text-3xl font-extrabold text-white num-tabular tracking-tight my-1 drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]">
          {showBalance ? formatCurrency(summary?.total_balance || 0) : "••••••••"}
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Net Arus Kas Bulan Ini</span>
          <span
            className={`font-bold num-tabular ${
              netSavings >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {showBalance
              ? `${netSavings >= 0 ? "+" : ""}${formatCurrency(netSavings)}`
              : "••••••"}
          </span>
        </div>
      </Card>

      {/* Monthly Cashflow Analytics Grid */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Arus Kas Bulan Ini
          </h2>
          <span className="text-[11px] font-medium text-slate-500">
            {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
              <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-bold">Pemasukan</span>
            </div>
            <p className="text-base font-extrabold text-emerald-300 num-tabular">
              {showBalance ? formatCurrency(incomeTotal) : "••••••"}
            </p>
          </div>

          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 shadow-xs">
            <div className="flex items-center gap-1.5 text-rose-400 mb-1">
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-bold">Pengeluaran</span>
            </div>
            <p className="text-base font-extrabold text-rose-300 num-tabular">
              {showBalance ? formatCurrency(expenseTotal) : "••••••"}
            </p>
          </div>
        </div>

        {/* Visual Cashflow Ratio Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium num-tabular">
            <span>Pemasukan ({incomePercent}%)</span>
            <span>Pengeluaran ({100 - incomePercent}%)</span>
          </div>
          <div
            className="w-full h-2 rounded-full bg-rose-500/20 overflow-hidden flex border border-white/[0.06]"
            role="progressbar"
            aria-label="Rasio arus kas masuk versus keluar"
            aria-valuenow={incomePercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-emerald-500 transition-[width] duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              style={{ width: `${incomePercent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Projects Teaser & Telemetry Section */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" /> Proyek Bisnis ({projects.length})
          </h2>
          <Link
            to="/projects"
            className="text-xs font-semibold text-indigo-400 flex items-center gap-0.5 hover:text-indigo-300 focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none rounded-sm transition-colors"
          >
            Kelola Proyek <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {projects.length === 0 ? (
            <div className="p-4 text-xs text-slate-400 bg-white/[0.03] rounded-xl border border-white/[0.08] w-full text-center">
              Belum ada proyek bisnis. Tambahkan proyek di menu Proyek.
            </div>
          ) : (
            projects.map((p) => (
              <Link
                key={p.id}
                to="/projects"
                className="min-w-[170px] bg-white/[0.04] hover:bg-white/[0.07] rounded-2xl p-3.5 flex flex-col justify-between border border-white/[0.08] hover:border-indigo-500/40 transition-all press-scale shadow-sm relative overflow-hidden group"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: p.color || "#6366F1", boxShadow: `0 0 8px ${p.color || "#6366F1"}` }}
                  aria-hidden="true"
                />
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold border border-white/20 shadow-xs"
                    style={{ backgroundColor: p.color || "#6366F1" }}
                  >
                    {p.code || p.name.slice(0, 3)}
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      p.net_profit >= 0
                        ? "text-emerald-400 bg-emerald-500/15"
                        : "text-rose-400 bg-rose-500/15"
                    }`}
                  >
                    {p.margin_percentage}%
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-indigo-300 truncate transition-colors">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase mt-0.5">Laba Bersih</p>
                  <p
                    className={`text-sm font-extrabold num-tabular ${
                      p.net_profit >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {showBalance ? formatCurrency(p.net_profit) : "••••••"}
                  </p>
                </div>
              </Link>
            ))
          )}
          <Link
            to="/projects"
            aria-label="Tambah Proyek Baru"
            className="min-w-[100px] bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-dashed border-white/20 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 press-scale focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none transition-all"
          >
            <Plus className="w-5 h-5 mb-0.5 text-slate-400" aria-hidden="true" />
            <span className="text-xs font-semibold">Proyek</span>
          </Link>
        </div>
      </div>

      {/* Wallets & Accounts Section */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" /> Dompet & Rekening ({wallets.length})
          </h2>
          <Link
            to="/settings"
            className="text-xs font-semibold text-indigo-400 flex items-center gap-0.5 hover:text-indigo-300 focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none rounded-sm transition-colors"
          >
            Kelola <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {wallets.length === 0 ? (
            <div className="p-4 text-xs text-slate-400 bg-white/[0.03] rounded-xl border border-white/[0.08] w-full text-center">
              Belum ada dompet. Tambahkan rekening atau dompet di menu Setelan.
            </div>
          ) : (
            wallets.map((w) => (
              <div
                key={w.id}
                className="min-w-[145px] bg-white/[0.04] rounded-2xl p-3.5 flex flex-col justify-between border border-white/[0.08] hover:border-indigo-500/40 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs border border-white/20"
                    style={{ backgroundColor: w.color || "#6366F1" }}
                  >
                    <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-bold text-white truncate">{w.name}</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">{w.type}</p>
                  <p className="text-sm font-extrabold text-white num-tabular">
                    {showBalance ? formatCurrency(w.current_balance) : "••••••"}
                  </p>
                </div>
              </div>
            ))
          )}
          <Link
            to="/settings"
            aria-label="Tambah Dompet Baru"
            className="min-w-[100px] bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-dashed border-white/20 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 press-scale focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none transition-all"
          >
            <Plus className="w-5 h-5 mb-0.5 text-slate-400" aria-hidden="true" />
            <span className="text-xs font-semibold">Tambah</span>
          </Link>
        </div>
      </div>

      {/* Debt & Receivable Status Highlight */}
      <Link
        to="/debts"
        className="block rounded-2xl focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none"
      >
        <Card
          interactive
          className="p-3.5 flex items-center justify-between bg-amber-500/10 border-amber-500/25"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <HandCoins className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">Status Hutang & Piutang</p>
              <p className="text-xs text-amber-400/90 mt-0.5 num-tabular">
                Hutang: <b>{showBalance ? formatCurrency(summary?.total_debt || 0) : "••••"}</b> •
                Piutang:{" "}
                <b>{showBalance ? formatCurrency(summary?.total_receivable || 0) : "••••"}</b>
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400" aria-hidden="true" />
        </Card>
      </Link>

      {/* Recent Transactions List */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Transaksi Terakhir
          </h2>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none rounded-sm transition-colors"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="space-y-1.5">
          {summary?.recent_transactions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 bg-white/[0.03] rounded-2xl border border-white/[0.08]">
              Belum ada transaksi tercatat.
            </p>
          ) : (
            summary?.recent_transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 bg-white/[0.04] rounded-2xl border border-white/[0.08] flex items-center justify-between shadow-xs hover:border-white/15 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      tx.type === "income" || tx.type === "transfer_in"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                    }`}
                  >
                    {tx.type === "income" || tx.type === "transfer_in" ? (
                      <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white">
                        {tx.note ||
                          tx.category_name ||
                          (tx.type.includes("transfer") ? "Transfer Antar Dompet" : "Pengeluaran")}
                      </p>
                      {tx.project_name ? (
                        <span
                          className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md uppercase border"
                          style={{
                            color: tx.project_color || "#6366F1",
                            borderColor: `${tx.project_color || "#6366F1"}40`,
                            backgroundColor: `${tx.project_color || "#6366F1"}15`,
                          }}
                        >
                          {tx.project_code || tx.project_name.slice(0, 3)}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {tx.wallet_name} • {relativeDate(tx.date)}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-extrabold num-tabular ${
                    tx.type === "income" || tx.type === "transfer_in"
                      ? "text-emerald-400"
                      : "text-rose-400"
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
