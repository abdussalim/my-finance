import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { formatCurrency, relativeDate } from "../lib/format";
import { DashboardSummary, WalletWithBalance } from "@my-finance/shared";
import { Wallet, ArrowDownRight, ArrowUpRight, HandCoins, ArrowRight } from "lucide-react";
import { Link } from "react-router";

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="py-8 space-y-4 animate-pulse">
        <div className="h-28 bg-white rounded-3xl" />
        <div className="h-32 bg-white rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Ikhtisar Keuangan</p>
        <h1 className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight mt-0.5">
          {formatCurrency(summary?.total_balance || 0)}
        </h1>
      </div>

      {/* Monthly Flow Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-emerald-50/50 border-emerald-100">
          <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
            <ArrowDownRight className="w-4 h-4" />
            <span className="text-xs font-semibold">Pemasukan</span>
          </div>
          <p className="text-base font-bold text-emerald-700">
            {formatCurrency(summary?.month_income || 0)}
          </p>
        </Card>

        <Card className="p-4 bg-rose-50/50 border-rose-100">
          <div className="flex items-center gap-1.5 text-rose-600 mb-1">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-xs font-semibold">Pengeluaran</span>
          </div>
          <p className="text-base font-bold text-rose-700">
            {formatCurrency(summary?.month_expense || 0)}
          </p>
        </Card>
      </div>

      {/* Wallets Horizontal Scroll */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700">Dompet & Rekening</h2>
          <Link to="/settings" className="text-xs text-[#007AFF] font-medium flex items-center">
            Kelola <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {wallets.length === 0 ? (
            <div className="p-4 text-xs text-gray-400 bg-white rounded-2xl w-full text-center">
              Belum ada dompet. Tambahkan di menu Setelan.
            </div>
          ) : (
            wallets.map((w) => (
              <div
                key={w.id}
                className="min-w-[140px] bg-white rounded-2xl p-4 border border-black/[0.03] apple-card-shadow flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: w.color || "#007AFF" }}
                  >
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 truncate">{w.name}</span>
                </div>
                <span className="text-sm font-extrabold text-[#1D1D1F]">
                  {formatCurrency(w.current_balance)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Debt & Receivable Quick Highlight */}
      <Link to="/debts">
        <Card className="p-4 flex items-center justify-between bg-amber-50/50 border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800">Status Hutang & Piutang</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Hutang: <b>{formatCurrency(summary?.total_debt || 0)}</b> • Piutang:{" "}
                <b>{formatCurrency(summary?.total_receivable || 0)}</b>
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-600" />
        </Card>
      </Link>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700">Transaksi Terakhir</h2>
          <Link to="/transactions" className="text-xs text-[#007AFF] font-medium">
            Semua
          </Link>
        </div>
        <div className="space-y-2">
          {summary?.recent_transactions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4 bg-white rounded-2xl">
              Belum ada transaksi
            </p>
          ) : (
            summary?.recent_transactions.map((tx) => (
              <Card key={tx.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#1D1D1F]">
                    {tx.category_name || (tx.type.includes("transfer") ? "Transfer Saldo" : "Umum")}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {tx.wallet_name} • {relativeDate(tx.date)}
                  </p>
                </div>
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
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
