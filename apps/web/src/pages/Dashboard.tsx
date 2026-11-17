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
  ChevronRight,
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
        <div className="h-40 bg-[#1C1C1E] rounded-[20px] border border-white/[0.04]" />
        <div className="h-32 bg-[#1C1C1E] rounded-[20px] border border-white/[0.04]" />
        <div className="h-48 bg-[#1C1C1E] rounded-[20px] border border-white/[0.04]" />
      </div>
    );
  }

  const netSavings = (summary?.month_income || 0) - (summary?.month_expense || 0);
  const incomeTotal = summary?.month_income || 0;
  const expenseTotal = summary?.month_expense || 0;

  return (
    <div className="space-y-6 pt-2 pb-6">
      {/* 1. iOS Navigation Header: Large Title Style */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#8E8E93]">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ringkasan</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowBalance(!showBalance)}
          aria-label={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          className="w-8 h-8 rounded-full bg-[#1C1C1E] border border-white/[0.08] flex items-center justify-center text-[#8E8E93] hover:text-white ios-press cursor-pointer focus-visible:outline-none transition-colors"
        >
          {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. iOS Core Hero Card: Inset Grouped Balance */}
      <Card className="p-5 bg-[#1C1C1E] border border-white/[0.06]">
        <div className="flex items-center justify-between pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
            Total Saldo Kas & Bank
          </span>
          <span className="text-[11px] font-medium text-[#8E8E93] bg-[#2C2C2E] px-2 py-0.5 rounded-full">
            {wallets.length} Akun
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-bold text-white num-tabular tracking-tight my-2">
          {showBalance ? formatCurrency(summary?.total_balance || 0) : "••••••••"}
        </div>

        {/* Inflow vs Outflow iOS Sub-Pills */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 mt-2 border-t border-white/[0.06]">
          <div className="p-2.5 bg-[#2C2C2E] rounded-[14px] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#30D158]/15 text-[#30D158] flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#8E8E93] block font-medium">Pemasukan</span>
              <span className="text-xs font-semibold text-[#30D158] num-tabular truncate block">
                {showBalance ? formatCurrency(incomeTotal) : "••••••"}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-[#2C2C2E] rounded-[14px] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#FF453A]/15 text-[#FF453A] flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#8E8E93] block font-medium">Pengeluaran</span>
              <span className="text-xs font-semibold text-[#FF453A] num-tabular truncate block">
                {showBalance ? formatCurrency(expenseTotal) : "••••••"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. iOS Inset Grouped: Proyek Bisnis Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#0A84FF]" /> Proyek Bisnis ({projects.length})
          </h2>
          <Link
            to="/projects"
            className="text-[13px] font-medium text-[#0A84FF] flex items-center gap-0.5 hover:opacity-80 transition-opacity"
          >
            Lihat Semua <ChevronRight className="w-3.5 h-3.5 text-[#0A84FF]" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {projects.length === 0 ? (
            <div className="p-4 text-xs text-[#8E8E93] bg-[#1C1C1E] rounded-[18px] border border-white/[0.06] text-center">
              Belum ada proyek bisnis. Tambahkan di menu Proyek.
            </div>
          ) : (
            projects.slice(0, 3).map((p) => {
              const progress = p.progress_percentage || 0;

              return (
                <Link
                  key={p.id}
                  to="/projects"
                  className="block p-4 bg-[#1C1C1E] rounded-[18px] border border-white/[0.06] hover:border-white/[0.12] transition-colors ios-press"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-[8px] flex items-center justify-center text-white text-[11px] font-bold shadow-xs"
                        style={{ backgroundColor: p.color || "#0A84FF" }}
                      >
                        {p.code || p.name.slice(0, 3)}
                      </div>
                      <span className="text-sm font-semibold text-white">{p.name}</span>
                    </div>

                    <span className="text-xs font-semibold text-[#0A84FF] num-tabular">
                      {progress}% Selesai
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#8E8E93] text-[11px]">Nilai Kontrak</span>
                    <span className="font-semibold text-white num-tabular">
                      {p.target_revenue ? formatCurrency(p.target_revenue) : "-"}
                    </span>
                  </div>

                  {/* iOS Style Smooth Progress Track */}
                  <div className="w-full bg-[#2C2C2E] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: p.color || "#0A84FF",
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#8E8E93] pt-2">
                    <span className="flex items-center gap-1 text-[#30D158]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {p.completed_tasks || 0} Selesai
                    </span>
                    <span className="flex items-center gap-1 text-[#FF9F0A]">
                      <Clock className="w-3.5 h-3.5" /> {p.pending_tasks || 0} Tertunda
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* 4. iOS Accounts Strip: Rekening & Dompet */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-[#0A84FF]" /> Rekening & Dompet
          </h2>
          <Link
            to="/settings"
            className="text-[13px] font-medium text-[#0A84FF] flex items-center gap-0.5 hover:opacity-80 transition-opacity"
          >
            Atur <ChevronRight className="w-3.5 h-3.5 text-[#0A84FF]" />
          </Link>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="min-w-[145px] bg-[#1C1C1E] rounded-[18px] p-3.5 border border-white/[0.06] flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="w-6 h-6 rounded-[8px] flex items-center justify-center text-white text-[10px] font-bold shadow-xs"
                  style={{ backgroundColor: w.color || "#0A84FF" }}
                >
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-white truncate">{w.name}</span>
              </div>
              <span className="text-sm font-bold text-white num-tabular">
                {showBalance ? formatCurrency(w.current_balance) : "••••••"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. iOS Inset Grouped: Hutang & Piutang */}
      {(summary?.total_debt || 0) > 0 || (summary?.total_receivable || 0) > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
              <HandCoins className="w-3.5 h-3.5 text-[#0A84FF]" /> Kewajiban & Piutang
            </h2>
            <Link
              to="/debts"
              className="text-[13px] font-medium text-[#0A84FF] flex items-center gap-0.5 hover:opacity-80 transition-opacity"
            >
              Rincian <ChevronRight className="w-3.5 h-3.5 text-[#0A84FF]" />
            </Link>
          </div>

          <Card className="p-3.5 bg-[#1C1C1E] border border-white/[0.06]">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-[#2C2C2E] rounded-[14px]">
                <span className="text-[10px] text-[#8E8E93] font-medium block">Harus Dibayar (Utang)</span>
                <span className="text-sm font-bold text-[#FF453A] num-tabular mt-0.5 block">
                  {showBalance ? formatCurrency(summary?.total_debt || 0) : "••••••"}
                </span>
              </div>

              <div className="p-3 bg-[#2C2C2E] rounded-[14px]">
                <span className="text-[10px] text-[#8E8E93] font-medium block">Harus Diterima (Piutang)</span>
                <span className="text-sm font-bold text-[#30D158] num-tabular mt-0.5 block">
                  {showBalance ? formatCurrency(summary?.total_receivable || 0) : "••••••"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {/* 6. iOS Inset Grouped Table: Recent Transactions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider">
            Transaksi Terakhir
          </h2>
          <Link
            to="/transactions"
            className="text-[13px] font-medium text-[#0A84FF] flex items-center gap-0.5 hover:opacity-80 transition-opacity"
          >
            Semua <ChevronRight className="w-3.5 h-3.5 text-[#0A84FF]" />
          </Link>
        </div>

        <div className="bg-[#1C1C1E] rounded-[20px] border border-white/[0.06] overflow-hidden divide-y divide-white/[0.06]">
          {summary?.recent_transactions.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#8E8E93]">
              Belum ada transaksi tercatat.
            </div>
          ) : (
            summary?.recent_transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="ios-row flex items-center justify-between p-3.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
                      tx.type === "income"
                        ? "bg-[#30D158]/15 text-[#30D158]"
                        : "bg-[#FF453A]/15 text-[#FF453A]"
                    }`}
                  >
                    {tx.type === "income" ? (
                      <ArrowDownRight className="w-4 h-4 stroke-[2.2]" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-white truncate">
                        {tx.category_name || (tx.type === "income" ? "Pemasukan" : "Pengeluaran")}
                      </p>
                      {tx.project_code ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-[#5E5CE6]/15 text-[#5E5CE6] border border-[#5E5CE6]/30">
                          {tx.project_code}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-[#8E8E93] mt-0.5 truncate">
                      {tx.wallet_name} • {relativeDate(tx.date)}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold num-tabular shrink-0 pl-2 ${
                    tx.type === "income" ? "text-[#30D158]" : "text-[#FF453A]"
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
