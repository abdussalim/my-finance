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
  Briefcase,
  Plus,
  CheckCircle2,
  Clock,
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
      <div className="py-6 space-y-4 animate-pulse" role="status" aria-label="Memuat data ikhtisar…">
        <div className="h-36 bg-[#12141D] rounded-2xl border border-white/[0.06]" />
        <div className="h-28 bg-[#12141D] rounded-2xl border border-white/[0.06]" />
        <div className="h-44 bg-[#12141D] rounded-2xl border border-white/[0.06]" />
      </div>
    );
  }

  const netSavings = (summary?.month_income || 0) - (summary?.month_expense || 0);
  const incomeTotal = summary?.month_income || 0;
  const expenseTotal = summary?.month_expense || 0;
  const flowTotal = incomeTotal + expenseTotal;
  const incomePercent = flowTotal > 0 ? Math.round((incomeTotal / flowTotal) * 100) : 50;

  return (
    <div className="space-y-6 pt-2 pb-6">
      {/* 1. Top Header: Calm & Crisp */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">Ringkasan Finansial</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowBalance(!showBalance)}
          aria-label={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          className="w-9 h-9 rounded-xl bg-[#161925] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white press-scale cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-colors"
        >
          {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Primary Focal Point: Core Balance Card */}
      <Card className="p-5 bg-[#12141D] border border-white/[0.08]">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Total Saldo Kas & Bank
          </span>
          <span className="text-[11px] font-semibold text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.06]">
            {wallets.length} Akun
          </span>
        </div>

        <div className="text-3xl font-bold text-white num-tabular tracking-tight my-2">
          {showBalance ? formatCurrency(summary?.total_balance || 0) : "••••••••"}
        </div>

        {/* Inflow vs Outflow Mini Summary */}
        <div className="grid grid-cols-2 gap-3 pt-3 mt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Masuk Bulan Ini</span>
              <span className="text-xs font-semibold text-emerald-400 num-tabular">
                {showBalance ? formatCurrency(incomeTotal) : "••••••"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Keluar Bulan Ini</span>
              <span className="text-xs font-semibold text-rose-400 num-tabular">
                {showBalance ? formatCurrency(expenseTotal) : "••••••"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Multi-Venture Projects Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Proyek Bisnis & Ventura
            </h2>
          </div>
          <Link
            to="/projects"
            className="text-xs font-medium text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors"
          >
            Semua Proyek ({projects.length}) <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {projects.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 bg-[#12141D] rounded-xl border border-white/[0.06] text-center">
              Belum ada proyek bisnis. Tambahkan di menu Proyek.
            </div>
          ) : (
            projects.slice(0, 3).map((p) => {
              const taskCount = (p.completed_tasks || 0) + (p.pending_tasks || 0);
              const progress = p.progress_percentage || 0;

              return (
                <Link
                  key={p.id}
                  to="/projects"
                  className="block p-3.5 bg-[#12141D] rounded-xl border border-white/[0.07] hover:border-white/[0.14] transition-colors press-scale"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: p.color || "#6366F1" }}
                      >
                        {p.code || p.name.slice(0, 3)}
                      </div>
                      <span className="text-xs font-bold text-white">{p.name}</span>
                    </div>

                    <span className="text-[11px] font-semibold text-indigo-400 num-tabular">
                      {progress}% Selesai
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 text-[11px]">Nilai Kontrak</span>
                    <span className="font-semibold text-white num-tabular">
                      {p.target_revenue ? formatCurrency(p.target_revenue) : "-"}
                    </span>
                  </div>

                  <div className="w-full bg-[#1A1D2B] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: p.color || "#6366F1",
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> {p.completed_tasks || 0} Selesai
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <Clock className="w-3 h-3" /> {p.pending_tasks || 0} Tertunda
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Rekening Dompet Horizontal Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Rekening & Dompet
            </h2>
          </div>
          <Link
            to="/settings"
            className="text-xs font-medium text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors"
          >
            Atur <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="min-w-[140px] bg-[#12141D] rounded-xl p-3 border border-white/[0.07] flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: w.color || "#6366F1" }}
                >
                  <Wallet className="w-3 h-3" />
                </div>
                <span className="text-xs font-semibold text-white truncate">{w.name}</span>
              </div>
              <span className="text-xs font-bold text-white num-tabular">
                {showBalance ? formatCurrency(w.current_balance) : "••••••"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Hutang & Piutang Summary */}
      {(summary?.total_debt || 0) > 0 || (summary?.total_receivable || 0) > 0 ? (
        <Card className="p-4 bg-[#12141D] border border-white/[0.07]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Kewajiban & Piutang
              </h2>
            </div>
            <Link
              to="/debts"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              Buka Hutang
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 bg-[#171A27] rounded-xl">
              <span className="text-[10px] text-slate-400 font-medium block">Harus Dibayar (Utang)</span>
              <span className="text-xs font-bold text-rose-400 num-tabular mt-0.5 block">
                {showBalance ? formatCurrency(summary?.total_debt || 0) : "••••••"}
              </span>
            </div>

            <div className="p-2.5 bg-[#171A27] rounded-xl">
              <span className="text-[10px] text-slate-400 font-medium block">Harus Diterima (Piutang)</span>
              <span className="text-xs font-bold text-emerald-400 num-tabular mt-0.5 block">
                {showBalance ? formatCurrency(summary?.total_receivable || 0) : "••••••"}
              </span>
            </div>
          </div>
        </Card>
      ) : null}

      {/* 6. Recent Transactions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Transaksi Terakhir
          </h2>
          <Link
            to="/transactions"
            className="text-xs font-medium text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors"
          >
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {summary?.recent_transactions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 bg-[#12141D] rounded-xl border border-white/[0.06]">
              Belum ada transaksi tercatat.
            </div>
          ) : (
            summary?.recent_transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-[#12141D] rounded-xl border border-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === "income"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {tx.type === "income" ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-white">
                        {tx.category_name || (tx.type === "income" ? "Pemasukan" : "Pengeluaran")}
                      </p>
                      {tx.project_code ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {tx.project_code}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {tx.wallet_name} • {relativeDate(tx.date)}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold num-tabular ${
                    tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
